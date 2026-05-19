# WAF and DDoS Guide

Application code can throttle forms and login attempts, but it cannot stop large network-level DDoS attacks. Production protection must be implemented at the DNS/CDN/WAF layer.

## Cloudflare baseline

1. Put the domain behind Cloudflare proxy.
2. Enable DDoS protection.
3. Enable WAF managed rules.
4. Enable bot fight / bot mitigation.
5. Add rate limiting rules:
   - `/api/forms/*`: limit repeated submissions per IP.
   - `/api/admin/login`: strict login throttling.
   - `/api/admin/media`: strict upload endpoint limits.
6. Add admin route protection:
   - Challenge `/admin*` and `/api/admin*` outside trusted geography/IPs where appropriate.
   - Require HTTPS.
7. Add Turnstile/CAPTCHA to public forms.
8. Cache static assets aggressively.
9. Use origin shielding.
10. Configure alerts for traffic spikes and 5xx errors.

## App-level controls included

- Login rate limiting.
- Account lockout after repeated failed logins.
- Form submission throttling.
- Upload file size and extension limits.
- Security event logging.
- HTTP security headers.

## Required production hardening

- Malware scanning for uploaded PDFs/docs.
- 2FA for admin accounts.
- IP allowlisting for super-admin users if possible.
- Backup monitoring.
- WAF logs reviewed weekly during admissions season.
