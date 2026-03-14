# Send Discord Message Skill

Use this skill to send a Discord message to any user via the Chrome controller.

## Requirements

- Chrome controller server must be running on port 9999
- Claude Controller extension must be loaded and active in Chrome
- Discord must be accessible at discord.com

## How to send a message

```python
import json, urllib.request, time

def chrome(action, **kwargs):
    cmd = json.dumps({'action': action, **kwargs}).encode()
    req = urllib.request.Request('http://localhost:9999/cmd', data=cmd,
                                  headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=35) as r:
        return json.loads(r.read())

# Replace CHANNEL_ID with the user's DM channel ID
chrome('navigate', url='https://discord.com/channels/@me/CHANNEL_ID')
time.sleep(4)
chrome('click', selector='[data-slate-editor="true"]')
time.sleep(1)
chrome('insert_text', selector='[data-slate-editor="true"]', text='MESSAGE HERE')
time.sleep(1)
chrome('key', key='Enter', keyCode=13)
```

## Known DM channel IDs

- Jumpz: `733515022483062855`

## Finding a channel ID

To find someone's DM channel ID:
1. Navigate to discord.com/channels/@me
2. Click on the person's DM in the sidebar
3. The URL will be `discord.com/channels/@me/CHANNEL_ID`

## Important notes

- Use `insert_text` with `[data-slate-editor="true"]` selector — Discord uses Slate.js editor
- Text is inserted via ClipboardEvent paste (most reliable method)
- Send with `key` action using Enter (keyCode 13) — NOT the send button
- Always wait `time.sleep(1)` between steps
- Navigate directly to the DM channel URL, don't rely on clicking sidebar links
- If the server times out, restart it: `nohup /home/hazem/gdocs-api/venv/bin/python /home/hazem/chrome-controller/server.py > /tmp/chrome_server.log 2>&1 &`
