# ── Claude Code Setup ────────────────────────────────────────────────────────
# Auto-added by claude-setup install.sh

# Local bin and Bun on PATH (required for claude-smart and bun)
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$PATH"

# claude-mem plugin worker (thedotmack/claude-mem)
alias claude-mem='bun "$HOME/.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs"'

# Main claude alias — routes through claude-smart wrapper
# (clickable URLs + auto API-key fallback when Pro limit hit)
alias claude='claude-smart'
