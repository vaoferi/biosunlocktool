from __future__ import annotations

from pathlib import Path
import subprocess
import sys


def main() -> int:
    repo = Path.cwd()
    probe = subprocess.run(
        ["git", "status", "--porcelain=v1", "--untracked-files=all"],
        cwd=repo,
        text=True,
        capture_output=True,
    )
    if probe.returncode != 0:
        detail = (probe.stderr or probe.stdout).strip()
        print(f"WORKTREE CLEAN: FAIL — git status unavailable: {detail}")
        return 2

    dirty = [line for line in probe.stdout.splitlines() if line.strip()]
    if dirty:
        print("WORKTREE CLEAN: FAIL")
        print("Repository has staged, modified, deleted, renamed, or untracked files:")
        for line in dirty:
            print(line)
        print(
            "Resolve every item without destructive cleanup: finish and commit/push the owning work, "
            "or keep the task In Progress / BLOCKED until ownership is clear."
        )
        return 1

    print("WORKTREE CLEAN: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
