---
name: auto-backup
description: |
  Automatically save a timestamped backup of finanskalkulator.html after completing any task that modifies the file. Use this skill proactively whenever you finish editing finanskalkulator.html — after verifying JS syntax passes, copy the current version to a backup file. Also use when the user says "lagre backup", "save backup", "ta backup", or "sikkerhetskopi". This skill should trigger after EVERY completed edit session on the calculator file, without the user needing to ask.
---

# Auto-Backup: finanskalkulator.html

After completing any task that modifies `finanskalkulator.html`, save a timestamped backup copy. This protects against accidental breakage and gives the user rollback points.

## When to run

- After every completed edit to `finanskalkulator.html` (proactively, without being asked)
- When the user explicitly asks for a backup

## How to backup

1. Generate a timestamp in format `YYYYMMDD_HHMM` using bash: `date +%Y%m%d_%H%M`
2. Copy the current file:
   ```bash
   cp "/sessions/laughing-great-pasteur/mnt/Web Projects Hobby/finanskalkulator.html" \
      "/sessions/laughing-great-pasteur/mnt/Web Projects Hobby/finanskalkulator_backup_<TIMESTAMP>.html"
   ```
3. Briefly confirm to the user: "Backup lagret: `finanskalkulator_backup_<TIMESTAMP>.html`"

## Important

- The backup path is the same folder as the original file
- Do NOT delete old backups unless the user asks
- If a backup with the same timestamp already exists, append `_2`, `_3` etc.
- This should be the LAST step before playing the notification sound (if sound is enabled)
