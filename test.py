import requests
import json
import glob
import os

jobs = glob.glob('backend/tmp/*')
latest_job = max([j for j in jobs if os.path.isdir(j)], key=os.path.getmtime)
job_id = os.path.basename(latest_job)

print(f'Testing job {job_id}...')

res = requests.post(f'http://127.0.0.1:8000/api/jobs/{job_id}/extract-answers?force=true')
if res.status_code == 200:
    data = res.json()
    print('SUCCESS! Extracted answers:', data['answerCount'])
    for ans in data.get('answers', []):
        print(f" - {ans.get('detectedQuestionLabel')}: {ans.get('text')[:30]}... ({len(ans.get('regions', []))} regions)")
else:
    print('FAILED:', res.status_code, res.text)
