# 🔒 Security Policy

## Our Commitment to Security & Privacy

**SAMVAD v2.0** is designed from the ground up as a **100% offline, privacy-first AI meeting assistant**. Security and privacy are foundational pillars of our architecture.

---

## 🛡️ Supported Versions

Only the latest major release of SAMVAD v2.0 receives security updates:

| Version | Supported | Notes |
| :--- | :---: | :--- |
| **2.0.x** | ✅ | Current Active Version |
| < 2.0.0 | ❌ | End of Life / Unsupported |

---

## 🔒 Security Architecture Highlights

1. **Zero External Cloud Calls**: All audio processing, ASR transcription, speaker diarization, executive summary generation, and RAG Q&A take place **locally** on your device.
2. **Container Security Hardening**:
   - Backend containers run as a dedicated, unprivileged non-root user (`samvad:1001`).
   - Container capabilities are explicitly dropped (`cap_drop: - ALL`).
   - SUID privilege escalation is disabled (`security_opt: - no-new-privileges:true`).
   - Nginx reverse proxy enforces `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`, and `X-XSS-Protection` headers.
3. **No Secret Tracking**: Zero API keys, passwords, or credentials are hardcoded into version control.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or potential privacy risk in SAMVAD v2.0, please follow these steps:

1. **Do NOT open a public GitHub issue.**
2. Send a detailed report describing the issue to the maintainers at:
   `priyansu.das@example.com` *(or via private GitHub Security Advisory)*
3. Include:
   - Description of the vulnerability.
   - Steps to reproduce the issue.
   - Potential security or data impact.

We will acknowledge receipt of your report within **48 hours** and provide regular progress updates until the issue is resolved.
