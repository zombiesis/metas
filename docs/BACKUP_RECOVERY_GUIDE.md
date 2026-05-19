# Backup and Recovery Guide

## Backups required

1. PostgreSQL database backups.
2. Uploaded media/object storage backups.
3. Environment variables stored in a secure password manager.
4. Deployment rollback snapshots.
5. Compliance document archive.

## Suggested schedule

- Database: daily automated backup, 30-day retention.
- Media: versioned object storage with deletion protection.
- Compliance documents: monthly offline archive.
- Pre-launch: manual backup before DNS switch.

## Recovery test

Quarterly, restore the database to a staging environment and verify:

- Public pages render.
- Admin login works.
- Media links work.
- Forms save submissions.
- Document downloads work.
- Audit logs are intact.
