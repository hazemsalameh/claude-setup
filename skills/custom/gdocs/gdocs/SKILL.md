# Google Docs Skill

Use this skill to create new Google Docs or edit existing ones on behalf of the user.

## Setup

All scripts are in `/home/hazem/gdocs-api/`. The venv is at `/home/hazem/gdocs-api/venv/`.
OAuth token is saved at `/home/hazem/gdocs-api/token.pickle` — no login needed unless expired.

## How to create a new Google Doc

Run `/home/hazem/gdocs-api/venv/bin/python /home/hazem/gdocs-api/create_new.py` after updating the `text` and `title` variables in that file. The script will print the doc URL when done.

Or write an inline script:

```python
import pickle
from googleapiclient.discovery import build

with open('/home/hazem/gdocs-api/token.pickle', 'rb') as f:
    creds = pickle.load(f)

drive = build('drive', 'v3', credentials=creds)
docs = build('docs', 'v1', credentials=creds)

doc = drive.files().create(body={
    'name': 'TITLE HERE',
    'mimeType': 'application/vnd.google-apps.document'
}).execute()

docs.documents().batchUpdate(
    documentId=doc['id'],
    body={'requests': [{'insertText': {'location': {'index': 1}, 'text': 'CONTENT HERE'}}]}
).execute()

print(f"https://docs.google.com/document/d/{doc['id']}/edit")
```

## How to edit an existing Google Doc

Extract the doc ID from the URL: `docs.google.com/document/d/DOC_ID/edit`

```python
import pickle
from googleapiclient.discovery import build

DOC_ID = 'paste-doc-id-here'

with open('/home/hazem/gdocs-api/token.pickle', 'rb') as f:
    creds = pickle.load(f)

docs = build('docs', 'v1', credentials=creds)

# Read
doc = docs.documents().get(documentId=DOC_ID).execute()
text = ''
for el in doc.get('body', {}).get('content', []):
    if 'paragraph' in el:
        for pe in el['paragraph']['elements']:
            if 'textRun' in pe:
                text += pe['textRun']['content']

# Get end index for deletion
end_index = 1
for el in doc.get('body', {}).get('content', []):
    if 'endIndex' in el:
        end_index = el['endIndex']

# Replace all content
requests = []
if end_index > 2:
    requests.append({'deleteContentRange': {'range': {'startIndex': 1, 'endIndex': end_index - 1}}})
requests.append({'insertText': {'location': {'index': 1}, 'text': 'NEW CONTENT HERE'}})

docs.documents().batchUpdate(documentId=DOC_ID, body={'requests': requests}).execute()
```

## Important notes

- If token.pickle is expired, delete it and re-run the OAuth flow: `PYTHONUNBUFFERED=1 /home/hazem/gdocs-api/venv/bin/python -u /home/hazem/gdocs-api/humanize.py > /tmp/humanize_out.txt 2>&1 & sleep 8 && cat /tmp/humanize_out.txt` — then have user visit the URL printed
- Always use the venv python: `/home/hazem/gdocs-api/venv/bin/python`
- The OAuth account is `hazemsalameh30@gmail.com`
