"""
Caching layer using SQLite for storing ablation results.
"""

import sqlite3
import json
import hashlib
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable


class ResultCache:
    """SQLite-based cache for API results."""

    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.db_path = cache_dir / "cache.db"
        self.cache_dir.mkdir(exist_ok=True, parents=True)
        self._init_db()

    def _init_db(self):
        """Initialize database schema if needed."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cache_entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agents_hash TEXT NOT NULL,
                task_id TEXT NOT NULL,
                result_hash TEXT NOT NULL,
                api_response TEXT NOT NULL,
                tokens_used INTEGER,
                cost_usd REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                UNIQUE(agents_hash, task_id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS run_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                run_id TEXT UNIQUE NOT NULL,
                agents_md_hash TEXT NOT NULL,
                baseline_pass_rate REAL,
                total_api_calls INTEGER,
                total_cost_usd REAL,
                duration_seconds REAL,
                report_json_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_agents_hash ON cache_entries(agents_hash)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_created_at ON cache_entries(created_at)")

        conn.commit()
        conn.close()

    def _hash_agents_md(self, agents_md: str) -> str:
        """Create hash of AGENTS.md content."""
        return hashlib.sha256(agents_md.encode()).hexdigest()[:16]

    def get_or_fetch(
        self,
        task_id: str,
        agents_md: str,
        fetch_fn: Callable[[], Dict[str, Any]]
    ) -> tuple[Dict[str, Any], bool]:
        """
        Get cached result or fetch new one.
        
        Returns: (result, was_cached)
        """
        agents_hash = self._hash_agents_md(agents_md)
        cached = self.get(agents_hash, task_id)

        if cached:
            return cached, True
        else:
            result = fetch_fn()
            self.set(agents_hash, task_id, result)
            return result, False

    def get(self, agents_hash: str, task_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached result."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT api_response FROM cache_entries
            WHERE agents_hash = ? AND task_id = ?
            AND (expires_at IS NULL OR expires_at > datetime('now'))
            ORDER BY created_at DESC LIMIT 1
        """, (agents_hash, task_id))

        row = cursor.fetchone()
        conn.close()

        if row:
            return json.loads(row[0])
        return None

    def set(
        self,
        agents_hash: str,
        task_id: str,
        result: Dict[str, Any],
        ttl_days: int = 30
    ):
        """Store result in cache."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        result_hash = hashlib.md5(json.dumps(result, sort_keys=True).encode()).hexdigest()[:8]
        expires_at = datetime.now() + timedelta(days=ttl_days)

        cursor.execute("""
            INSERT OR REPLACE INTO cache_entries
            (agents_hash, task_id, result_hash, api_response, tokens_used, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            agents_hash,
            task_id,
            result_hash,
            json.dumps(result),
            result.get('tokens_used', 0),
            expires_at.isoformat()
        ))

        conn.commit()
        conn.close()

    def clear(self):
        """Clear entire cache."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM cache_entries")
        conn.commit()
        conn.close()
        print("✓ Cache cleared")

    def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM cache_entries")
        count = cursor.fetchone()[0]

        cursor.execute("SELECT SUM(tokens_used), SUM(cost_usd) FROM cache_entries WHERE cost_usd IS NOT NULL")
        row = cursor.fetchone()
        total_tokens = row[0] or 0
        total_cost = row[1] or 0.0

        conn.close()

        return {
            'cached_results': count,
            'total_tokens_saved': total_tokens,
            'estimated_cost_saved': round(total_cost, 2),
            'cache_location': str(self.db_path),
        }

    def save_run_history(
        self,
        agents_hash: str,
        baseline_pass_rate: float,
        api_calls: int,
        cost_usd: float,
        duration_seconds: float,
        report_path: Path
    ):
        """Record a run in history."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        run_id = datetime.now().isoformat()

        cursor.execute("""
            INSERT INTO run_history
            (run_id, agents_md_hash, baseline_pass_rate, total_api_calls, total_cost_usd, duration_seconds, report_json_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (run_id, agents_hash, baseline_pass_rate, api_calls, cost_usd, duration_seconds, str(report_path)))

        conn.commit()
        conn.close()
