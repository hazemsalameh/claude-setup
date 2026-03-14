# Claude Code Power Setup Guide

A complete, step-by-step guide to replicate this exact Claude Code environment from scratch — including plugins, smart wrappers, Google Docs automation, and auto-updating.

---

## What You're Getting

| Feature | What it does |
|---|---|
| **claude-smart** | Wrapper that adds clickable URLs + auto-switches to API key when your Pro limit hits, then back to Pro when it resets |
| **claude-mem** | Persistent memory across sessions — Claude remembers your preferences, projects, and decisions |
| **context-mode** | Keeps your context window from flooding with raw command output |
| **ui-ux-pro-max** | Adds professional UI/UX design skills and prompts |
| **Auto-update** | Every new Claude session pulls the latest version of this repo and applies it |
| **Google Docs API** | Lets Claude create and edit Google Docs programmatically |

---

## Prerequisites

You need **Windows 11 + WSL2** (Ubuntu) or a native **Ubuntu 22.04+** system.

### Install core tools

```bash
# Update apt
sudo apt update && sudo apt upgrade -y

# Python 3 (usually pre-installed)
sudo apt install -y python3 python3-pip python3-venv

# Git
sudo apt install -y git

# Node.js 20+ (via nvm — recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Bun (used by claude-mem plugin)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### Verify
```bash
node --version   # should be v20+
bun --version    # should be 1.x
python3 --version  # should be 3.10+
git --version
```

---

## Step 1: Get a Claude Pro Subscription

1. Go to **https://claude.ai**
2. Click **Upgrade to Pro** (top right)
3. Subscribe — $20/month gives you 5x more usage than free

> Claude Code works on the free tier too, but you'll hit limits fast. Pro is worth it.

---

## Step 2: Install Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

Verify:
```bash
claude --version
```

Then run it once to log in:
```bash
claude
```

Follow the browser OAuth flow — it will open **https://claude.ai** and ask you to authorize the CLI.

---

## Step 3: Get an Anthropic API Key (for fallback)

This is used automatically when your Pro usage limit hits during a session.

1. Go to **https://console.anthropic.com**
2. Click **API Keys** in the left sidebar
3. Click **Create Key**
4. Name it something like `claude-smart-fallback`
5. Copy the key — it starts with `sk-ant-api03-...`
6. **Save it immediately** — you can't view it again

Store it:
```bash
mkdir -p ~/.config/claude-fallback
echo 'sk-ant-api03-YOUR-KEY-HERE' > ~/.config/claude-fallback/api_key
chmod 600 ~/.config/claude-fallback/api_key
```

---

## Step 4: Clone This Repo and Run the Installer

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/claude-setup.git
cd claude-setup
bash install.sh
source ~/.bashrc
```

The installer will:
- Copy `claude-smart` and `claude-linkify` to `~/.local/bin/`
- Write `~/.claude/settings.json` with plugins + auto-update hook
- Add `claude` alias to your `~/.bashrc`
- Set up the Google Docs venv (if `~/gdocs-api/` exists)
- Register a **SessionStart hook** so every new Claude session auto-pulls this repo

---

## Step 5: Install Claude Code Plugins

Plugins are installed from inside Claude Code. Start a session:

```bash
claude
```

Then run these slash commands inside Claude:

### Plugin 1: claude-mem (Memory System)
```
/plugins
```
- Click **Add marketplace**
- Source: `github`, Repo: `thedotmack/claude-mem`
- Click **Install**
- Enable the plugin

> **What it does:** Gives Claude persistent memory. It remembers your preferences, past decisions, project context, and feedback across all sessions. You'll see a memory index at the top of every session.

### Plugin 2: context-mode (Context Window Protection)
```
/plugins
```
- Click **Add marketplace**
- Source: `github`, Repo: `mksglu/context-mode`
- Click **Install**
- Enable the plugin

> **What it does:** Runs commands in a sandbox so large outputs (logs, file listings, etc.) don't flood your context window. Adds `ctx_batch_execute`, `ctx_search`, and other tools.

### Plugin 3: ui-ux-pro-max (UI/UX Skills)
```
/plugins
```
- Click **Add marketplace**
- Source: `github`, Repo: `nextlevelbuilder/ui-ux-pro-max-skill`
- Click **Install**
- Enable the plugin

> **What it does:** Adds professional UI/UX design patterns, component breakdowns, and design review capabilities as slash commands.

After installing all three, **exit and restart Claude**:
```bash
exit
claude
```

---

## Step 6: Verify the Setup

After restarting, you should see:
1. A **memory index** at the top of the session (from claude-mem) — shows past session summaries
2. Context-mode tools available (like `ctx_batch_execute`)
3. The `claude-smart` wrapper active — check with `which claude` → should show `/home/YOU/.local/bin/claude-smart`... actually it shows the alias. Test: run `claude --version` and check it still works.

Test clickable URLs: ask Claude to print a URL and ctrl+click it in Windows Terminal.

---

## Step 7: Google Docs API Setup (Optional)

This lets Claude create and format Google Docs on your behalf.

### 7a. Create a Google Cloud Project

1. Go to **https://console.cloud.google.com**
2. Click the project dropdown (top left) → **New Project**
3. Name it `claude-gdocs` → **Create**
4. Make sure the new project is selected

### 7b. Enable the Google Docs API

1. In the left sidebar: **APIs & Services** → **Library**
2. Search: `Google Docs API`
3. Click it → **Enable**
4. Also enable `Google Drive API` (needed to share docs)

### 7c. Create a Service Account

1. Left sidebar: **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **Service Account**
3. Name: `claude-gdocs-sa` → **Create and Continue**
4. Role: **Editor** → **Continue** → **Done**
5. Click the service account email you just created
6. Go to **Keys** tab → **Add Key** → **Create new key** → **JSON**
7. It downloads a file like `project-name-abc123.json`

Move it:
```bash
mkdir -p ~/gdocs-api
mv ~/Downloads/project-name-*.json ~/gdocs-api/service_account.json
chmod 600 ~/gdocs-api/service_account.json
```

### 7d. Set Up the Python Environment

```bash
cd ~/gdocs-api
python3 -m venv venv
source venv/bin/activate
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 7e. Share Docs with the Service Account

When Claude creates a doc, it's owned by the service account. To view it yourself:
- The service account email is in `service_account.json` under `"client_email"`
- Claude will share the doc with your personal Gmail automatically if you tell it to

---

## How the Auto-Update Works

Every time you start a new Claude session, a **SessionStart hook** runs:

```bash
cd ~/claude-setup && git pull --quiet && bash install.sh --quiet
```

This means:
- If I push an update to this repo (new scripts, fixed bugs, new settings), you get it automatically next session
- The install script is idempotent — it won't overwrite your personal customizations
- Runs silently in the background — you won't even notice it

To manually update:
```bash
cd ~/claude-setup && git pull && bash install.sh
```

---

## How claude-smart Works

The `claude-smart` wrapper does three things:

### 1. Clickable URLs
Every URL Claude outputs becomes clickable (Ctrl+Click) in Windows Terminal using OSC 8 hyperlink escape sequences.

### 2. Auto API Fallback
When your Claude Pro usage limit hits:
- Claude prints a message like "Usage limit reached, resets at 4:00 PM"
- `claude-smart` detects this, saves the reset time
- Next session automatically uses your API key from `~/.config/claude-fallback/api_key`
- When the reset time passes, it switches back to Pro automatically

State is stored in `~/.config/claude-fallback/state.json`. To force reset back to Pro:
```bash
echo '{"mode":"pro","reset_at":null}' > ~/.config/claude-fallback/state.json
```

### 3. Skip Permissions
Automatically passes `--dangerously-skip-permissions` so Claude doesn't prompt you for every file operation. Only use this on your own machine.

---

## File Structure

```
claude-setup/
├── README.md                    ← this file
├── install.sh                   ← idempotent installer
├── bin/
│   ├── claude-smart             ← main wrapper (URLs + fallback)
│   └── claude-linkify           ← URL-only wrapper (legacy)
├── config/
│   ├── settings.json            ← Claude settings with plugins + hooks
│   └── bashrc_additions.sh      ← aliases added to ~/.bashrc
└── gdocs-api/
    └── requirements.txt         ← Python deps for Google Docs
```

What gets installed to your system:
```
~/.local/bin/claude-smart        ← wrapper script
~/.local/bin/claude-linkify      ← legacy wrapper
~/.claude/settings.json          ← Claude config
~/.config/claude-fallback/
    api_key                      ← your Anthropic API key (you add this)
    state.json                   ← auto-managed fallback state
```

---

## Troubleshooting

### `claude` command not found after install
```bash
source ~/.bashrc
```
Or open a new terminal.

### URLs not clickable
Make sure you're using **Windows Terminal** (not ConEmu, old cmd, etc.). In Windows Terminal settings, ensure `"experimental.detectURLs"` is not set to false.

### claude-mem not showing memory at session start
The worker service needs Bun. Check:
```bash
which bun
bun --version
```
If missing: `curl -fsSL https://bun.sh/install | bash`

### Pro limit fallback not working
Check the API key file exists and has no extra whitespace:
```bash
cat ~/.config/claude-fallback/api_key | xxd | head -2
```
The key should start with `73 6b 2d` (ASCII for `sk-`).

### Plugin not showing up
Exit Claude fully (`/exit`) and relaunch. Plugins load on startup.

---

## Keeping Up to Date

The auto-pull hook handles this automatically. But to check what changed:
```bash
cd ~/claude-setup
git log --oneline -10
```

---

## Credits & Links

- **Claude Code CLI**: https://docs.anthropic.com/en/docs/claude-code
- **claude-mem plugin**: https://github.com/thedotmack/claude-mem
- **context-mode plugin**: https://github.com/mksglu/context-mode
- **ui-ux-pro-max plugin**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **awesome-claude-code** (discover more tools): https://github.com/hesreallyhim/awesome-claude-code
- **Anthropic Console** (API keys): https://console.anthropic.com
- **Google Cloud Console**: https://console.cloud.google.com
