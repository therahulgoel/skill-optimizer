"""Configuration and environment management for Skill Optimizer."""

import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class APIConfig:
    """Configuration for OpenAI API."""
    api_key: Optional[str]
    model: str = "gpt-4"
    temperature: float = 0.3
    max_retries: int = 3
    timeout_seconds: int = 30

    @classmethod
    def from_env(cls) -> "APIConfig":
        """Load configuration from environment variables."""
        return cls(
            api_key=os.getenv('OPENAI_API_KEY'),
            model=os.getenv('OPENAI_MODEL', 'gpt-4'),
            temperature=float(os.getenv('OPENAI_TEMPERATURE', '0.3')),
            max_retries=int(os.getenv('OPENAI_RETRIES', '3')),
            timeout_seconds=int(os.getenv('OPENAI_TIMEOUT', '30')),
        )

    def is_available(self) -> bool:
        """Whether API key is configured."""
        return bool(self.api_key)


@dataclass
class CacheConfig:
    """Configuration for caching layer."""
    enabled: bool = True
    cache_dir: Path = Path('.skill-optimizer')

    @classmethod
    def from_env(cls) -> "CacheConfig":
        """Load configuration from environment variables."""
        return cls(
            enabled=os.getenv('CACHE_ENABLED', 'true').lower() == 'true',
            cache_dir=Path(os.getenv('CACHE_DIR', '.skill-optimizer')),
        )

    def setup(self):
        """Ensure cache directory exists."""
        self.cache_dir.mkdir(exist_ok=True, parents=True)


@dataclass
class AppConfig:
    """Complete application configuration."""
    api: APIConfig
    cache: CacheConfig
    debug: bool = False

    @classmethod
    def from_env(cls) -> "AppConfig":
        """Load complete configuration from environment."""
        return cls(
            api=APIConfig.from_env(),
            cache=CacheConfig.from_env(),
            debug=os.getenv('DEBUG', 'false').lower() == 'true',
        )

    def setup(self):
        """Initialize configuration (create directories, etc.)."""
        self.cache.setup()

    def log_config(self):
        """Print configuration for debugging."""
        print("\n📋 Skill Optimizer Configuration")
        print(f"  API Available: {'🔑 Yes' if self.api.is_available() else '❌ No (will use mock)'}")
        print(f"  Model: {self.api.model}")
        print(f"  Caching: {'✓ Enabled' if self.cache.enabled else '✗ Disabled'}")
        print(f"  Cache Dir: {self.cache.cache_dir}")
        print()
