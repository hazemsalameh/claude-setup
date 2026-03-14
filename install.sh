#!/usr/bin/env bash
# install.sh — Apply claude-setup to your system
# Safe to re-run: all operations are idempotent
# Usage: bash install.sh [--quiet]

set -euo pipefail

QUIET=false
[[ "${1:-}" == "--quiet" ]] && QUIET=true

log()  { $QUIET || echo "[claude-setup] $*"; }
warn() { echo "[claude-setup] WARNING: $*" >&2; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 0. Install Node.js, Bun, and Claude Code if missing ──────────────────────
if ! command -v node &>/dev/null; then
    log "Installing Node.js via nvm..."
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    source "$NVM_DIR/nvm.sh"
    nvm install --lts --silent
fi

if ! command -v bun &>/dev/null; then
    log "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

if ! command -v claude &>/dev/null && ! ls "$HOME/.local/share/claude/versions/"* &>/dev/null 2>&1; then
    log "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code --silent
fi

# ── 1. Install plugins ───────────────────────────────────────────────────────
log "Installing Claude Code plugins..."
mkdir -p "$HOME/.claude/plugins/marketplaces"
declare -A PLUGINS=(
    ["thedotmack"]="https://github.com/thedotmack/claude-mem"
    ["context-mode"]="https://github.com/mksglu/context-mode"
    ["ui-ux-pro-max-skill"]="https://github.com/nextlevelbuilder/ui-ux-pro-max-skill"
)
for name in "${!PLUGINS[@]}"; do
    url="${PLUGINS[$name]}"
    dest="$HOME/.claude/plugins/marketplaces/$name"
    if [[ ! -d "$dest" ]]; then
        log "  Cloning plugin: $name"
        git clone --quiet "$url" "$dest" 2>/dev/null || log "  ✗ Failed to clone $name"
    fi
    # Run bun install if package.json exists and node_modules is missing
    if [[ -f "$dest/package.json" && ! -d "$dest/node_modules" ]]; then
        log "  Installing dependencies: $name"
        (cd "$dest" && bun install --silent 2>/dev/null) || true
    fi
done

# ── 2. Copy wrapper scripts ───────────────────────────────────────────────────
log "Installing wrapper scripts to ~/.local/bin/"
mkdir -p "$HOME/.local/bin"
cp "$REPO_DIR/bin/claude-smart"   "$HOME/.local/bin/claude-smart"
cp "$REPO_DIR/bin/claude-linkify" "$HOME/.local/bin/claude-linkify"
chmod +x "$HOME/.local/bin/claude-smart" "$HOME/.local/bin/claude-linkify"

# ── 2. Apply Claude settings (merge hooks + plugins) ─────────────────────────
log "Applying Claude settings (~/.claude/settings.json)"
mkdir -p "$HOME/.claude"
# Only write if missing — don't overwrite user customisations on every pull
if [[ ! -f "$HOME/.claude/settings.json" ]]; then
    cp "$REPO_DIR/config/settings.json" "$HOME/.claude/settings.json"
    log "  Created settings.json"
else
    # Ensure the SessionStart auto-pull hook is present
    python3 - <<'EOF'
import json, sys, os

settings_path = os.path.expanduser("~/.claude/settings.json")
repo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "settings.json")

with open(settings_path) as f:
    current = json.load(f)
with open(repo_path) as f:
    desired = json.load(f)

changed = False

# Merge enabledPlugins
for k, v in desired.get("enabledPlugins", {}).items():
    if current.setdefault("enabledPlugins", {}).get(k) != v:
        current["enabledPlugins"][k] = v
        changed = True

# Merge extraKnownMarketplaces
for k, v in desired.get("extraKnownMarketplaces", {}).items():
    if k not in current.setdefault("extraKnownMarketplaces", {}):
        current["extraKnownMarketplaces"][k] = v
        changed = True

# Ensure SessionStart auto-pull hook exists
desired_hook_cmd = "cd ~/claude-setup && git pull --quiet 2>/dev/null && bash install.sh --quiet 2>/dev/null || true"
hooks = current.setdefault("hooks", {})
session_hooks = hooks.setdefault("SessionStart", [])
already_present = any(
    any(h.get("command") == desired_hook_cmd for h in entry.get("hooks", []))
    for entry in session_hooks
)
if not already_present:
    session_hooks.append({"hooks": [{"type": "command", "command": desired_hook_cmd}]})
    changed = True

# Ensure skipDangerousModePermissionPrompt
if not current.get("skipDangerousModePermissionPrompt"):
    current["skipDangerousModePermissionPrompt"] = True
    changed = True

if changed:
    with open(settings_path, "w") as f:
        json.dump(current, f, indent=2)
    print("[claude-setup]   Merged updates into existing settings.json")
EOF
fi

# ── 3. Add aliases to ~/.bashrc if not already there ─────────────────────────
MARKER="# ── Claude Code Setup ────"
if ! grep -qF "$MARKER" "$HOME/.bashrc" 2>/dev/null; then
    log "Adding aliases to ~/.bashrc"
    echo "" >> "$HOME/.bashrc"
    cat "$REPO_DIR/config/bashrc_additions.sh" >> "$HOME/.bashrc"
    log "  Done. Run: source ~/.bashrc"
else
    log "~/.bashrc aliases already present — skipping"
fi

# ── 4. Set up Google Docs API venv (optional) ─────────────────────────────────
if [[ -d "$HOME/gdocs-api" ]]; then
    if [[ ! -d "$HOME/gdocs-api/venv" ]]; then
        log "Creating Python venv for gdocs-api..."
        python3 -m venv "$HOME/gdocs-api/venv"
        "$HOME/gdocs-api/venv/bin/pip" install -q -r "$REPO_DIR/gdocs-api/requirements.txt"
        log "  gdocs-api venv ready"
    fi
else
    log "Skipping gdocs-api setup (~/gdocs-api not found)"
fi

# ── 5. Install commands (slash commands) ─────────────────────────────────────
log "Installing commands to ~/.claude/commands/"
mkdir -p "$HOME/.claude/commands"
cp "$REPO_DIR"/commands/*.md "$HOME/.claude/commands/" 2>/dev/null && log "  Commands installed" || log "  No commands found"

# ── 6. Install custom skills ──────────────────────────────────────────────────
log "Installing custom skills to ~/.claude/skills/"
mkdir -p "$HOME/.claude/skills"
for skill_dir in "$REPO_DIR/skills/custom"/*/; do
    skill_name=$(basename "$skill_dir")
    if [[ ! -d "$HOME/.claude/skills/$skill_name" ]]; then
        cp -r "$skill_dir" "$HOME/.claude/skills/$skill_name"
        log "  Installed custom skill: $skill_name"
    fi
done

# ── 7. Clone third-party skill repos ─────────────────────────────────────────
if command -v git &>/dev/null && [[ -f "$REPO_DIR/skills/sources.txt" ]]; then
    log "Cloning third-party skills (skipping already installed)..."
    while IFS= read -r line; do
        [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
        url="$line"
        skill_name=$(basename "$url" .git)
        if [[ ! -d "$HOME/.claude/skills/$skill_name" ]]; then
            log "  Cloning $skill_name..."
            git clone --quiet "$url" "$HOME/.claude/skills/$skill_name" 2>/dev/null && log "  ✓ $skill_name" || log "  ✗ $skill_name (failed — skipping)"
        fi
    done < "$REPO_DIR/skills/sources.txt"
fi

# ── 9. Ensure claude-fallback config dir exists ───────────────────────────────
mkdir -p "$HOME/.config/claude-fallback"
if [[ ! -f "$HOME/.config/claude-fallback/api_key" ]]; then
    log ""
    log "  ACTION REQUIRED: Add your Anthropic API key for fallback:"
    log "    echo 'sk-ant-api03-YOUR-KEY-HERE' > ~/.config/claude-fallback/api_key"
fi

log ""
log "Done! Start a new shell (or run: source ~/.bashrc) to activate."
