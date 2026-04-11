Prompt: Write a hook configuration JSON file for a PreToolUse hook that blocks the run_in_terminal tool from executing any rm -rf commands. The hook should enforce this deterministically via a shell command.

Verifier: Should be a JSON hook using PreToolUse with a shell command for enforcement

---

Baseline Output:
```json
{
  "hooks": [
    {
      "event": "PreToolUse",
      "tools": ["run_in_terminal"],
      "command": "echo \"$TOOL_INPUT\" | grep -q 'rm -rf' && echo 'BLOCKED: rm -rf is not allowed' && exit 1 || exit 0",
      "description": "Block destructive rm -rf commands in terminal",
      "blocking": true
    }
  ]
}
```
