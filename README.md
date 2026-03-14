# Claude Code Power Setup

One command gives you a fully loaded Claude Code environment — 334 slash commands, 20 skill packs, 3 plugins, smart wrappers, and auto-updates on every session.

```bash
git clone https://github.com/hazemsalameh/claude-setup.git && cd claude-setup && bash install.sh && source ~/.bashrc
```

---

## What You Get

| | Feature | Description |
|---|---|---|
| 🧠 | **claude-mem** | Claude remembers your preferences, projects, and decisions across every session |
| 🪟 | **context-mode** | Prevents large command outputs from flooding your context window |
| 🎨 | **ui-ux-pro-max** | Professional UI/UX design skills and review capabilities |
| 🔗 | **Clickable URLs** | Every URL Claude outputs is Ctrl+Clickable in Windows Terminal |
| 🔄 | **Auto API fallback** | When Pro limit hits, auto-switches to your API key — you keep working |
| ⚡ | **Auto-update** | Every new session silently pulls the latest version of this repo |
| 🚫 | **Skip permissions** | `--dangerously-skip-permissions` applied automatically — no more confirmation prompts |
| 📝 | **334 slash commands** | System tools, git workflows, debugging, AI management, and more |
| 🛠️ | **20 skill packs** | Agent frameworks, scientific tools, DevOps, engineering patterns |
| 📄 | **Google Docs API** | Claude can create and format Google Docs programmatically |

---

## Prerequisites

**Windows 11 + WSL2 (Ubuntu)** or native **Ubuntu 22.04+**

```bash
# 1. Install git, python3
sudo apt update && sudo apt install -y git python3 python3-pip python3-venv

# 2. Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc && nvm install --lts

# 3. Install Bun (required for claude-mem plugin)
curl -fsSL https://bun.sh/install | bash && source ~/.bashrc
```

---

## Full Setup (New Users)

### Step 1 — Get Claude Pro
1. Sign up at **https://claude.ai** → **Upgrade to Pro** ($20/month)

### Step 2 — Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
claude   # opens browser OAuth — click Authorize, then /exit
```

### Step 3 — Get Your Anthropic API Key (fallback)
1. Go to **https://console.anthropic.com** → **API Keys** → **Create Key**
2. Copy the key (starts with `sk-ant-api03-...`) — you can't see it again
3. Store it:
```bash
mkdir -p ~/.config/claude-fallback
echo 'sk-ant-api03-YOUR-KEY-HERE' > ~/.config/claude-fallback/api_key
chmod 600 ~/.config/claude-fallback/api_key
```

### Step 4 — Clone and Install
```bash
git clone https://github.com/hazemsalameh/claude-setup.git
cd claude-setup
bash install.sh
source ~/.bashrc
```

The installer handles everything:
- Copies `claude-smart` and `claude-linkify` to `~/.local/bin/`
- Writes `~/.claude/settings.json` (plugins + auto-update hook)
- Copies all 334 slash commands to `~/.claude/commands/`
- Copies custom skills (gdocs, chrome-control, send-discord-message)
- Clones all 17 third-party skill repos into `~/.claude/skills/`
- Adds `claude` alias and PATH to `~/.bashrc`
- Registers a **SessionStart hook** for auto-updates

### Step 5 — Install the 3 Plugins Inside Claude
```bash
claude
```
Type `/plugins` and install these three:

| Plugin | Marketplace repo |
|---|---|
| claude-mem | `thedotmack/claude-mem` |
| context-mode | `mksglu/context-mode` |
| ui-ux-pro-max | `nextlevelbuilder/ui-ux-pro-max-skill` |

For each: **Add marketplace** → Source: `github` → paste repo → **Install** → enable toggle.

Then `/exit` and reopen — you'll see the memory index at the top. ✓

---

## How --dangerously-skip-permissions Works

The `claude-smart` wrapper **automatically** passes `--dangerously-skip-permissions` to every Claude session. This means:
- No confirmation prompts for file reads, writes, or edits
- No "are you sure?" dialogs for bash commands
- Claude operates at full speed without interruptions

This is applied silently every time you run `claude`. You don't need to type it yourself.

To run a session **with** permission prompts (e.g. on someone else's machine):
```bash
claude-smart --no-skip-permissions   # not yet supported — use the real binary directly
~/.local/share/claude/versions/<version>   # run the real binary without the wrapper
```

---

## How Auto-Update Works

Every new Claude session runs this silently in the background:
```bash
cd ~/claude-setup && git pull --quiet && bash install.sh --quiet
```

- New commands, skills, and scripts you push to the repo are applied automatically
- The install script is idempotent — it won't overwrite personal customizations
- To update manually: `cd ~/claude-setup && bash sync.sh`

---

## Keeping Your Repo in Sync

When you add new commands or skills locally, push them back to the repo:
```bash
cd ~/claude-setup && bash sync.sh
```

`sync.sh` automatically:
- Copies all `~/.claude/commands/*.md` to `commands/`
- Copies custom skills (no git remote) to `skills/custom/`
- Updates `skills/sources.txt` with any new third-party skill repos
- Copies updated wrapper scripts
- Commits and pushes everything

---

## Repo Structure

```
claude-setup/
├── README.md                    ← this file
├── install.sh                   ← idempotent installer (run on every session start)
├── sync.sh                      ← push local changes back to this repo
├── bin/
│   ├── claude-smart             ← main wrapper: URLs + API fallback + skip-permissions
│   └── claude-linkify           ← URL-only wrapper (legacy)
├── config/
│   ├── settings.json            ← plugins + SessionStart auto-update hook
│   └── bashrc_additions.sh      ← aliases added to ~/.bashrc
├── commands/                    ← 334 slash command .md files
├── skills/
│   ├── custom/                  ← gdocs, chrome-control, send-discord-message
│   └── sources.txt              ← 17 third-party skill repos to clone
└── gdocs-api/
    └── requirements.txt         ← Python deps for Google Docs automation
```

---

## Google Docs API Setup (Optional)

Lets Claude create and format Google Docs on your behalf.

1. Go to **https://console.cloud.google.com** → create a project
2. Enable **Google Docs API** and **Google Drive API**
3. Create a **Service Account** → download the JSON key
4. Move it: `mv ~/Downloads/*.json ~/gdocs-api/service_account.json`
5. The installer sets up the Python venv automatically if `~/gdocs-api/` exists

---

## Troubleshooting

**`claude` not found after install**
```bash
source ~/.bashrc
```

**URLs not clickable** — use Windows Terminal (not old cmd/ConEmu). Ctrl+Click the URL.

**claude-mem memory not showing** — check Bun: `which bun && bun --version`

**Pro limit fallback not working** — verify API key: `cat ~/.config/claude-fallback/api_key`

**Plugin not appearing** — fully exit Claude (`/exit`) and relaunch.

---

## Links

- **Claude Code docs**: https://docs.anthropic.com/en/docs/claude-code
- **claude-mem plugin**: https://github.com/thedotmack/claude-mem
- **context-mode plugin**: https://github.com/mksglu/context-mode
- **ui-ux-pro-max plugin**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **awesome-claude-code**: https://github.com/hesreallyhim/awesome-claude-code
- **Anthropic Console**: https://console.anthropic.com
- **Google Cloud Console**: https://console.cloud.google.com
