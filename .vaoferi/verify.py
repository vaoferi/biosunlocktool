from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

SAFE_ENV_TEMPLATE_SUFFIXES = (".example", ".sample", ".template")
TEXT_SUFFIXES = {".md", ".py", ".json", ".toml", ".yml", ".yaml", ".txt"}
MAX_SECRET_SCAN_BYTES = 2 * 1024 * 1024
SECRET_PATTERNS = (
    ("AWS_ACCESS_KEY_ID", re.compile(rb"\bAKIA[0-9A-Z]{16}\b")),
    ("GITHUB_CLASSIC_TOKEN", re.compile(rb"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b")),
    ("GITHUB_FINE_GRAINED_TOKEN", re.compile(rb"\bgithub_pat_[A-Za-z0-9_]{50,}\b")),
    ("PRIVATE_KEY", re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("SLACK_TOKEN", re.compile(rb"\bxox[baprs]-[A-Za-z0-9-]{20,}\b")),
)
MOJIBAKE_MARKERS = ("\ufffd",)


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def load_manifest(root: Path) -> dict:
    path = root / ".vaoferi/manifest.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != 1:
        raise ValueError(f"unsupported manifest schema: {data.get('schema')!r}")
    return data


def tracked_files(root: Path) -> list[str]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=root,
        capture_output=True,
    )
    if result.returncode != 0:
        return []
    return [p.decode("utf-8", errors="strict") for p in result.stdout.split(b"\0") if p]


def is_real_env(path: str) -> bool:
    name = Path(path).name
    if name == ".env":
        return True
    if not name.startswith(".env."):
        return False
    return not name.endswith(SAFE_ENV_TEMPLATE_SUFFIXES)


def check_owned_text(rel: str, path: Path, data: bytes) -> list[str]:
    errors: list[str] = []
    if path.suffix.lower() not in TEXT_SUFFIXES:
        return errors
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return [f"utf8 check failed: {rel}"]
    if path.suffix.lower() == ".md" and data.startswith(b"\xef\xbb\xbf"):
        errors.append(f"bom check failed: {rel}")
    if any(marker in text for marker in MOJIBAKE_MARKERS):
        errors.append(f"mojibake check failed: {rel}")
    return errors


def check_tracked_secret_patterns(root: Path, rel: str) -> list[str]:
    path = root / rel
    try:
        if not path.is_file() or path.stat().st_size > MAX_SECRET_SCAN_BYTES:
            return []
        data = path.read_bytes()
    except OSError:
        return []
    errors: list[str] = []
    for rule_id, pattern in SECRET_PATTERNS:
        if pattern.search(data):
            errors.append(f"secret pattern {rule_id}: {rel}")
    return errors


def verify(root: Path) -> list[str]:
    errors: list[str] = []
    try:
        manifest = load_manifest(root)
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        return [f"manifest error: {exc}"]

    owned = manifest.get("owned_files", {})
    if not isinstance(owned, dict):
        return ["manifest error: owned_files must be an object"]

    for rel, expected in owned.items():
        path = root / rel
        if not path.is_file():
            errors.append(f"hash check failed: missing {rel}")
            continue
        data = path.read_bytes()
        errors.extend(check_owned_text(rel, path, data))
        actual = hashlib.sha256(data).hexdigest()
        if actual != expected:
            errors.append(f"hash check failed: {rel}")

    for rel in tracked_files(root):
        if is_real_env(rel):
            errors.append(f"tracked env forbidden: {rel}")
        errors.extend(check_tracked_secret_patterns(root, rel))

    return errors


def main() -> int:
    root = repo_root()
    errors = verify(root)
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print("OK: Start Here manifest and repository hygiene verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
