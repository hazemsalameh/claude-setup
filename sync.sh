#!/usr/bin/env bash
# sync.sh — Push your local Claude setup changes back to the repo
# Run this whenever you add new commands, skills, or scripts
# Usage: bash sync.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[sync] Syncing local Claude setup → repo..."

# ── Commands ──────────────────────────────────────────────────────────────────
echo "[sync] Copying commands..."
# NEVER sync lead-gen-outreach.md — proprietary process, exclusive to Hazem
for f in ~/.claude/commands/*.md; do
    [[ "$(basename "$f")" == "lead-gen-outreach.md" ]] && continue
    cp "$f" "$REPO_DIR/commands/"
done

# ── Custom skills (no git remote) ─────────────────────────────────────────────
echo "[sync] Syncing custom skills..."
mkdir -p "$REPO_DIR/skills/custom"
for skill_dir in ~/.claude/skills/*/; do
    skill_name=$(basename "$skill_dir")
    # Only include skills with no git remote (custom/local skills)
    if ! git -C "$skill_dir" remote get-url origin &>/dev/null; then
        cp -r "$skill_dir" "$REPO_DIR/skills/custom/$skill_name"
        echo "[sync]   Custom skill: $skill_name"
    fi
done

# ── Third-party skill repos (has git remote) ──────────────────────────────────
echo "[sync] Updating skill sources list..."
> "$REPO_DIR/skills/sources.txt"
echo "# Third-party skill repos — cloned by install.sh into ~/.claude/skills/" >> "$REPO_DIR/skills/sources.txt"
echo "# Format: github_url" >> "$REPO_DIR/skills/sources.txt"
for skill_dir in ~/.claude/skills/*/; do
    url=$(git -C "$skill_dir" remote get-url origin 2>/dev/null || true)
    if [[ -n "$url" ]]; then
        echo "$url" >> "$REPO_DIR/skills/sources.txt"
    fi
done

# ── Wrapper scripts ───────────────────────────────────────────────────────────
echo "[sync] Syncing wrapper scripts..."
cp ~/.local/bin/claude-smart   "$REPO_DIR/bin/claude-smart"
cp ~/.local/bin/claude-linkify "$REPO_DIR/bin/claude-linkify"

# ── Commit and push ───────────────────────────────────────────────────────────
cd "$REPO_DIR"
git add -A

if git diff --cached --quiet; then
    echo "[sync] Nothing changed — repo is already up to date."
else
    COUNT=$(git diff --cached --name-only | wc -l)
    git commit -m "sync: update $COUNT files from local setup"
    git push
    echo "[sync] Done — pushed $COUNT changed files to GitHub."
fi
