# Discord Download File Skill

Use this skill to download file attachments from a Discord DM channel.

## Requirements

- Chrome controller server running on port 9999
- Chrome extension active
- Discord open and logged in

## How it works

Navigate to the DM, trigger the download button on the attachment, then find the file in the Windows Downloads folder mounted at `/mnt/e/Downloads/`.

## Steps

### 1. Start the chrome controller server (if not running)

```bash
kill $(lsof -ti:9999) 2>/dev/null
nohup /home/hazem/gdocs-api/venv/bin/python /home/hazem/chrome-controller/server.py > /tmp/chrome_server.log 2>&1 &
sleep 2
```

Verify: `ss -tlnp | grep 9999`

### 2. Navigate to the DM and trigger downloads

```python
import json, urllib.request, time

def chrome(action, **kwargs):
    cmd = json.dumps({'action': action, **kwargs}).encode()
    req = urllib.request.Request('http://localhost:9999/cmd', data=cmd,
                                  headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=35) as r:
        return json.loads(r.read())

# Navigate to the DM
chrome('navigate', url='https://discord.com/channels/@me/CHANNEL_ID')
time.sleep(3)

# Scroll to bottom to reveal the latest attachments
chrome('scroll', x=0, y=99999)
time.sleep(1)

# Click all download-related selectors (Discord renders multiple)
for selector in [
    'a[aria-label*="Download"]',
    'a[download]',
    '[class*="downloadButton"]',
    '[class*="fileDownload"]',
]:
    try:
        chrome('click', selector=selector)
        time.sleep(0.5)
    except:
        pass
```

### 3. Find the downloaded file

Downloads land in `/mnt/e/Downloads/` (Windows Downloads folder via WSL):

```bash
ls -lt /mnt/e/Downloads/ | head -10
```

Or search by filename:

```bash
find /mnt/e/Downloads -name "*.pdf" | grep -i FILENAME
```

## Known DM channel IDs

- Jumpz (Fady): `733515022483062855`
- Hadi (AQ42): `706648465270112347`
- Omar (gezyy): see discord_contacts memory

## Notes

- Files always download to `/mnt/e/Downloads/` — NOT `/home/hazem/Downloads/` (that folder doesn't exist)
- If the same file was downloaded before, Discord appends ` (1)`, ` (2)`, etc.
- The `ping` action must succeed before any other chrome command — if it fails, restart the server
- `get_html` times out on Discord (React app); use `get_text` with specific selectors instead
- To read a downloaded PDF: use the `Read` tool with the full `/mnt/e/Downloads/filename.pdf` path
