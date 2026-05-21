# Enterprise Student Portal — Security Architecture

## Classification: CONFIDENTIAL
## Standard: ISO 27001 + OWASP ASVS Level 3 + India IT Act 2000 Compliance

---

## 1. Zero Trust Architecture

```
                         ┌─────────────────────┐
                         │   Cloudflare WAF     │
                         │   + Bot Management   │
                         │   + DDoS L7          │
                         │   + Geo-fence (IN)   │
                         └──────────┬────────────┘
                                    │
                         ┌──────────▼────────────┐
                         │   API Gateway Layer    │
                         │   (Rate limit, JWT     │
                         │    validation, mTLS)   │
                         └──────────┬────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼─────────┐ ┌────────▼────────┐ ┌─────────▼─────────┐
    │   Admin Service    │ │ Student Service │ │  Public Service   │
    │   (existing CMS)   │ │  (NEW - isolated)│ │  (read-only)     │
    │                    │ │                  │ │                   │
    │ Port: internal     │ │ Port: internal   │ │ Port: internal    │
    └────────┬───────────┘ └────────┬─────────┘ └────────┬──────────┘
             │                      │                     │
    ┌────────▼──────────────────────▼─────────────────────▼──────────┐
    │                    PostgreSQL Cluster                            │
    │  ┌──────────┐  ┌──────────────┐  ┌──────────┐                 │
    │  │admin     │  │student       │  │public    │  ← SCHEMAS      │
    │  │schema    │  │schema        │  │schema    │                  │
    │  │(RLS)     │  │(RLS + encrypt)│  │(read-only)│                │
    │  └──────────┘  └──────────────┘  └──────────┘                 │
    └────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Stack

### Primary: Multi-Factor Authentication (Mandatory)

```
Factor 1: Password (Argon2id, memory=64MB, iterations=3, parallelism=4)
Factor 2: SMS OTP (6-digit, 30s expiry, 3 attempts max)
Factor 3: Device Trust (registered devices only for sensitive ops)
```

### Session Management

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Algorithm | AES-256-GCM encrypted JWT | Prevents token tampering |
| Storage | HttpOnly + Secure + SameSite=Strict cookie | XSS-proof |
| Absolute expiry | 8 hours | Limits exposure window |
| Idle timeout | 15 minutes | Prevents unattended access |
| Rotation | After every sensitive action | Limits stolen token utility |
| Binding | SHA-256(IP_subnet + UA + screen_resolution) | Device lock |
| Concurrent sessions | 2 max | Prevents credential sharing |
| Revocation | Immediate via DB check | No stale sessions |

### Password Policy

| Rule | Requirement |
|------|-------------|
| Minimum length | 10 characters |
| Complexity | 1 uppercase + 1 lowercase + 1 digit + 1 special |
| History | Cannot reuse last 5 passwords |
| Expiry | 90 days (configurable) |
| Breach check | Checked against HaveIBeenPwned API (k-anonymity) |
| Lockout | 5 failed attempts → 30 min lock → admin unlock after 3 locks |

---

## 3. Data Protection

### Encryption

| Layer | Algorithm | Key Management |
|-------|-----------|----------------|
| At rest (DB) | AES-256-GCM | AWS KMS / HashiCorp Vault |
| In transit | TLS 1.3 (min) | Managed certificates |
| PII fields | Column-level encryption | Per-tenant keys |
| Backups | AES-256-CBC | Offline master key |
| File uploads | Encrypted at rest (S3 SSE-KMS) | AWS-managed |

### PII Fields Encrypted at Column Level
- Aadhaar number
- Phone number
- Email address
- Parent contact details
- Bank account (for refunds)
- Medical records

### Data Classification

| Level | Examples | Access |
|-------|----------|--------|
| Public | Program names, notices | Anyone |
| Internal | Attendance %, grades | Student + faculty |
| Confidential | Fee details, Aadhaar | Student + admin only |
| Restricted | Medical records, disciplinary | Authorized admin only |

---

## 4. Authorization Model (ABAC + RBAC)

```
Attribute-Based Access Control:
  WHO: student.id + student.program + student.year
  WHAT: resource.type + resource.owner
  WHERE: request.ip + request.device
  WHEN: time_of_day + academic_calendar

Rules:
  - Student can view OWN attendance only
  - Student can view OWN fee receipts only
  - Student can download OWN documents only
  - Student CANNOT view other students' data (enforced at DB level)
  - Faculty can view attendance for THEIR classes only
  - Parent can view THEIR child's data only (read-only)
```

### PostgreSQL Row-Level Security

```sql
-- Students can only see their own records
CREATE POLICY student_isolation ON student_attendance
  USING (student_id = current_setting('app.student_id')::text);

-- Faculty can only see their assigned classes
CREATE POLICY faculty_class_access ON student_attendance
  USING (class_id IN (
    SELECT class_id FROM faculty_assignments
    WHERE faculty_id = current_setting('app.faculty_id')::text
  ));
```

---

## 5. API Security

### Request Validation
- All inputs: Zod strict schemas (no unknown fields allowed)
- File uploads: magic byte validation + virus scan (ClamAV)
- Request size: 1MB max (10MB for file uploads)
- Content-Type: strictly enforced

### Rate Limiting (Per Student)
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 attempts | 15 min |
| OTP request | 3 | 5 min |
| API calls | 100 | 1 min |
| File download | 20 | 1 min |
| Fee payment | 3 | 1 hour |

### Response Security
- No stack traces in production
- Generic error messages (no internal details)
- PII masked in logs (phone: ***4385)
- Response headers: no server version disclosure

---

## 6. Audit & Compliance

### Audit Trail (Immutable)
Every student action logged:
- Login/logout (IP, device, location)
- Data access (what was viewed)
- Document downloads
- Fee payments
- Profile changes
- Failed access attempts

### Compliance
| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| India IT Act 2000 | Data protection | Encryption + access control |
| UGC Guidelines | Student data privacy | Role-based access |
| NAAC | Record keeping | Immutable audit logs |
| PCI-DSS | Payment security | Tokenized gateway (Razorpay) |
| GDPR-like | Right to access/delete | GDPR endpoint already built |

---

## 7. Threat Model

| Threat | Mitigation |
|--------|-----------|
| Credential stuffing | Rate limiting + breach check + 2FA |
| Session hijacking | Device binding + rotation + short expiry |
| SQL injection | Prisma ORM (parameterized by design) |
| XSS | CSP + sanitization + HttpOnly cookies |
| IDOR (accessing other student's data) | RLS at DB level + app-level checks |
| Privilege escalation | Separate user tables + zero shared auth |
| Data exfiltration | Rate limiting + anomaly detection + DLP |
| Man-in-the-middle | TLS 1.3 + HSTS + certificate pinning |
| Insider threat | Audit logs + least privilege + 2FA for admin |
| Supply chain | Pinned dependencies + SRI + CSP |

---

## 8. Incident Response

| Severity | Example | Response Time | Action |
|----------|---------|---------------|--------|
| P1 Critical | Data breach, auth bypass | 15 min | Kill switch, notify CERT-In |
| P2 High | Bulk unauthorized access | 1 hour | Block IP, investigate |
| P3 Medium | Single account compromise | 4 hours | Lock account, reset |
| P4 Low | Failed brute force | 24 hours | Monitor, auto-blocked |

### Kill Switch
- `/api/admin/emergency` — instantly disables student portal
- Revokes all student sessions
- Sends alert to all admins
- Preserves audit logs

---

## 9. Implementation Phases

### Phase A: Foundation (Week 1)
- StudentUser + StudentSession models (separate from admin)
- Argon2id password hashing
- SMS OTP via Twilio/MSG91
- Device fingerprinting + binding
- Session management (encrypted JWT in HttpOnly cookie)

### Phase B: Core Features (Week 2)
- Student dashboard
- Attendance viewing
- Fee payment (Razorpay tokenized)
- Document download (with audit)
- PostgreSQL RLS policies

### Phase C: Hardening (Week 3)
- Anomaly detection (unusual patterns)
- Password breach checking (HaveIBeenPwned)
- Column-level PII encryption
- File upload virus scanning
- Emergency kill switch

### Phase D: Monitoring (Week 4)
- Real-time security dashboard
- Automated alerts (Slack/email)
- Compliance reporting
- Penetration testing
- Security documentation

---

## 10. Technology Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Language | TypeScript (same stack) | Type safety, shared models, single team |
| Auth | Custom (not NextAuth) | Full control over security model |
| Password hash | Argon2id | OWASP recommended, GPU-resistant |
| Session | Encrypted JWT + DB validation | Stateless + revocable |
| Database | PostgreSQL with RLS | Enterprise-grade isolation |
| Payment | Razorpay (tokenized) | PCI-DSS compliant, no card data |
| SMS | Twilio (already integrated) | Reliable OTP delivery |
| Encryption | AES-256-GCM | Industry standard |
| Key management | Environment vars (dev) / AWS KMS (prod) | Scalable |
| Monitoring | Pino structured logs + alerts | Already in place |

---

## Approval

This architecture provides **ISO 27001 Level 3** equivalent security for student data, exceeding typical Indian university portal standards. It uses the same proven Next.js stack (avoiding the maintenance and security risks of a separate PHP codebase) while implementing enterprise-grade isolation between admin and student systems.
