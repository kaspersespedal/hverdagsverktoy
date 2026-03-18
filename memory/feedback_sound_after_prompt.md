---
name: Play sound after each prompt
description: Play Windows Notify Calendar.wav after completing each user request
type: feedback
---

After finishing each prompt/task, play the notification sound:
```
powershell -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Notify Calendar.wav').PlaySync()"
```
