# Honeypot routes

The following API routes are **honeypots** — they exist purely to trap
automated scanners and log probe traffic to `SecurityEvent`. Each one
re-exports the handler from `./wp-login/route.ts`:

| Route | Why attackers probe it |
|---|---|
| `/api/login.php`    | WordPress / generic PHP fingerprint |
| `/api/wp-admin`     | WordPress admin panel |
| `/api/wp-login`     | WordPress login |
| `/api/xmlrpc`       | WordPress XML-RPC |
| `/api/phpmyadmin`   | phpMyAdmin |
| `/api/phpinfo`      | PHP info disclosure |
| `/api/server-info`  | Apache server-info |
| `/api/shell`        | Generic web-shell probe |
| `/api/debug`        | Stack-trace / debug endpoints |
| `/api/filemanager`  | Various web-based file managers |
| `/api/db`           | Database admin tools |
| `/api/config`       | App configuration disclosure |
| `/api/docs`         | Swagger / API docs disclosure |
| `/api/administrator`| Joomla admin panel |
| `/api/users`        | Generic user-enumeration probe |
| `/api/backup`       | Backup-archive probe |

**Do not delete these without first removing the matching alias from any
WAF / Cloudflare rule that depends on them being present.**

If you implement a real `/api/users` (or any other path on this list), make
sure to delete the honeypot file first; otherwise the new route will be
shadowed by the trap.

The trap behaviour is in `wp-login/route.ts`. Audit-#2 N5/N21 tightened the
header allowlist (so legitimate users who mistype URLs don't have their
`Cookie`/`Authorization` headers persisted) and the adaptive stall (so
coordinated probes can't camp Node's connection pool).
