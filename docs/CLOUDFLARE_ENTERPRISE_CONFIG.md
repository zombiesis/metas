# Cloudflare Enterprise Configuration

## Your Stack
```
Users → Cloudflare Enterprise (WAF + Bot Management + DDoS) → Origin Server (Next.js)
```

## Required Settings in Cloudflare Dashboard

### 1. SSL/TLS
- Mode: **Full (Strict)**
- Minimum TLS: **1.3**
- Always Use HTTPS: **ON**
- HSTS: **ON** (max-age 1 year, include subdomains)

### 2. WAF Rules (Managed Rules)
- Enable: **Cloudflare Managed Ruleset**
- Enable: **OWASP Core Ruleset**
- Sensitivity: **High**
- Action: **Block**

### 3. Bot Management (Enterprise Feature)
- Bot Fight Mode: **ON**
- Super Bot Fight Mode: **Definitely automated → Block**
- Likely automated: **Challenge**
- Verified bots: **Allow**

### 4. Rate Limiting Rules
```
Rule 1: Login protection
  Path: /api/admin/login
  Rate: 5 requests per 10 seconds per IP
  Action: Block for 10 minutes

Rule 2: Form spam
  Path: /api/forms/*
  Rate: 3 requests per minute per IP
  Action: Challenge

Rule 3: API abuse
  Path: /api/*
  Rate: 60 requests per minute per IP
  Action: Challenge

Rule 4: Chatbot abuse
  Path: /api/chatbot
  Rate: 10 requests per minute per IP
  Action: Block for 5 minutes
```

### 5. Page Rules
```
Rule 1: Admin caching
  URL: */admin/*
  Cache Level: Bypass
  Security Level: High

Rule 2: Student portal
  URL: */student/*
  Cache Level: Bypass
  Security Level: I'm Under Attack

Rule 3: Static assets
  URL: */uploads/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
```

### 6. Firewall Rules (Custom)
```
Rule 1: Block non-India for admin
  Expression: (http.request.uri.path contains "/admin") and (ip.geoip.country ne "IN")
  Action: Block

Rule 2: Block known bad ASNs
  Expression: (ip.geoip.asnum in {AS4134 AS4837 AS9808})
  Action: Challenge

Rule 3: Block empty UA
  Expression: (http.user_agent eq "")
  Action: Block
```

### 7. DDoS Protection (Enterprise)
- L7 DDoS: **Enabled (automatic)**
- Sensitivity: **High**
- Advanced Rate Limiting: **Enabled**

### 8. Turnstile (Already Integrated)
- Site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Secret key in `TURNSTILE_SECRET_KEY`
- Mode: **Managed** (invisible when possible, challenge when suspicious)

### 9. DNS
```
A     suratcollege.metasofsda.in    → origin IP (proxied ☁️)
A     nursing.metasofsda.in         → origin IP (proxied ☁️)
CNAME www                           → suratcollege.metasofsda.in (proxied ☁️)
```

### 10. Origin Server Configuration
Set in `.env`:
```
TRUST_PROXY="cloudflare"
```
This tells the app to trust `cf-connecting-ip` header for real client IP.

## What Cloudflare Enterprise Gives You (That Our Code Doesn't Need To Handle)

| Feature | What it does | Our code equivalent |
|---------|-------------|-------------------|
| L7 DDoS mitigation | Absorbs 100Tbps+ attacks | Our rate limiting is backup only |
| Bot Management | ML-based bot detection | Our UA blocking is backup only |
| WAF (OWASP rules) | Blocks SQLi/XSS at edge | Our Prisma/CSP is defense-in-depth |
| IP reputation | Blocks known bad IPs | Our honeypots are early warning |
| Browser Integrity Check | Blocks headless browsers | Our Turnstile is backup |
| Under Attack Mode | JS challenge on every request | Emergency use only |
| Geo-blocking | Block countries at edge | Zero latency blocking |
| mTLS | Client certificate auth | For API-to-API communication |
| Argo Smart Routing | Fastest path to origin | Reduces latency 30%+ |
| Load Balancing | Multi-origin failover | For HA deployment |

## Security Layers (With CF Enterprise)

```
Layer 1: Cloudflare Edge (blocks 99% of attacks before reaching your server)
  - DDoS absorbed
  - Bots blocked
  - WAF rules applied
  - Rate limits enforced
  - Geo-blocking active
  - SSL terminated

Layer 2: Your Application (handles the 1% that gets through)
  - Turnstile CAPTCHA
  - Session auth + 2FA
  - RBAC
  - Input validation
  - Rate limiting (backup)
  - Honeypots + decoys

Layer 3: Database (last line of defense)
  - PostgreSQL RLS
  - Encrypted PII columns
  - Parameterized queries (Prisma)
```

## Cost Justification
With CF Enterprise, you can REMOVE these from your code (optional — keeping them as defense-in-depth is better):
- UA-based scanner blocking (CF Bot Management does this better)
- Global rate limiting in middleware (CF does this at edge, faster)
- DDoS protection logic (CF absorbs it before it reaches you)

But KEEP everything as defense-in-depth. If CF ever has an outage, your app still protects itself.
