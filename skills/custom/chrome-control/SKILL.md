# Chrome Control Skill

Use this skill to control the user's Chrome browser — navigate, click, type, read page content, take screenshots, etc.

## Setup

- Extension: `/home/hazem/chrome-controller/extension/` (loaded in Chrome as unpacked extension)
- Server: `/home/hazem/chrome-controller/server.py`
- Command script: `/home/hazem/chrome-controller/cmd.py`
- Python venv: `/home/hazem/gdocs-api/venv/bin/python`

## Starting the server

If the server isn't running, start it first:

```bash
kill $(lsof -ti:9999) 2>/dev/null
nohup /home/hazem/gdocs-api/venv/bin/python /home/hazem/chrome-controller/server.py > /tmp/chrome_server.log 2>&1 &
```

Verify it's running: `ss -tlnp | grep 9999`

## Sending commands

```bash
/home/hazem/gdocs-api/venv/bin/python /home/hazem/chrome-controller/cmd.py <action> [key=value ...]
```

### Available actions

| Action | Parameters | Example |
|--------|-----------|---------|
| `ping` | — | `cmd.py ping` |
| `get_url` | — | `cmd.py get_url` |
| `navigate` | `url=` | `cmd.py navigate url=https://youtube.com` |
| `click` | `selector=` | `cmd.py click selector="#button"` |
| `type` | `selector=`, `text=` | `cmd.py type selector="#search" text="hello"` |
| `get_text` | `selector=` (optional) | `cmd.py get_text selector="h1"` |
| `get_html` | — | `cmd.py get_html` |
| `scroll` | `x=`, `y=` | `cmd.py scroll y=500` |
| `screenshot` | — | `cmd.py screenshot` |

## Using in Python scripts

```python
import sys, json, urllib.request

def chrome(action, **kwargs):
    cmd = json.dumps({'action': action, **kwargs}).encode()
    req = urllib.request.Request('http://localhost:9999/cmd', data=cmd,
                                  headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=35) as r:
        return json.loads(r.read())

chrome('navigate', url='https://youtube.com')
chrome('click', selector='#search-input')
chrome('type', selector='#search-input', text='MrBeast')
text = chrome('get_text', selector='h1')
```

## Important notes

- The server must be running before sending commands
- The Chrome extension must be loaded and active (green popup = connected)
- Service worker stays alive via alarms (keepalive every 24 seconds)
- If extension stops responding, reload it at chrome://extensions
- Commands timeout after 30 seconds
