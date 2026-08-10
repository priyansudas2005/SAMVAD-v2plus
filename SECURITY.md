# Security Policy

Security and data privacy are core pillars of **SAMVAD**. Since the platform is designed to process sensitive corporate discussions, meeting recordings, and intellectual property, we maintain strict security boundaries in both our container configurations and source code execution.

Please read this policy to understand our security guarantees, supported versions, and how to report vulnerabilities.

---

## 🛡️ Supported Versions

We actively maintain and patch security vulnerabilities for the following versions:

| Version | Supported | Security Patches |
| :--- | :---: | :--- |
| **2.0.x** | ✅ | Active support, immediate patches. |
| **1.x.x** | ❌ | End of Life (EOL). No security updates. |

---

## 🔒 Security Best Practices & Hardening

SAMVAD implements multi-layer container hardening following industry standards:

### 1. Host and Container Boundary Isolation
* **Non-Root Execution**: Backend containers run under an unprivileged user (`samvad`, UID `1001`), preventing container breakout exploits from obtaining root privileges on the host.
* **Kernel Capability Dropping**: Docker containers drop all Linux capabilities (`cap_drop: - ALL`), ensuring the runtime cannot perform privileged system calls.
* **No Privilege Escalation**: Prevents processes inside the container from gaining new privileges via SUID binaries (`no-new-privileges:true`).

### 2. Network and Proxy Hardening
* **Gateway Entry Point**: The backend FastAPI engine is not exposed to the host network. All traffic must flow through Nginx, which acts as a reverse proxy.
* **Security Headers**: Nginx is configured to inject security headers on every response:
  * `X-Frame-Options: DENY` (prevents clickjacking)
  * `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing)
  * `Content-Security-Policy` (enforces strict asset loading origins)

### 3. Dependency Audits
* We pin exact dependency versions in `requirements.txt` and `package-lock.json` to prevent supply chain tampering.
* We recommend running periodic checks on your local deployment directory using tools like `safety` (for Python packages) or `npm audit` (for Node modules).

---

## 💾 Sensitive Data Handling

* **Zero Cloud Exfiltration**: All speech-to-text translation, speaker diarization feature extraction, local context storage, database writes, and RAG Q&A take place **locally** inside the isolated container network. No data, audio snippets, index files, or transcripts are sent to public cloud servers.
* **Storage Encryption**: SQLite database files (`transcripts.db`) and uploaded raw audio files are stored in Docker-managed named volumes on the host system. For maximum security, we recommend placing these directories on an encrypted filesystem (e.g., BitLocker on Windows, LUKS on Linux).

---

## 📜 Privacy Policy Summary

SAMVAD collects **zero analytics, telemetry, crash reports, or user usage metrics**. The system is completely self-contained and operates entirely offline. 

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or potential privacy risk, please help us resolve it securely by following our disclosure guidelines:

### How to Submit a Report
1. **Do NOT open a public GitHub issue.** Public issues invite immediate exploit attempts before a patch can be deployed.
2. Submit your report directly via **GitHub Private Security Advisory** under the repository's "Security" tab.
3. If you prefer email, send a detailed vulnerability brief to:
   * **`priyansu20053@gmail.com`**

### What to Include
* A detailed description of the vulnerability and its potential impact.
* Steps to reproduce the issue (including any proofs of concept, sample inputs, or code snippets).
* System environment details (Docker version, host OS, active compose flags).

---

## ⏱️ Expected Response Time

We take security reports seriously and commit to the following response timeline:
* **Initial Acknowledgment**: Within **48 hours** of receiving your report.
* **Status Updates**: Every **72 hours** while the vulnerability is being investigated and patched.
* **Public Disclosure**: Once a patch is fully compiled and merged into the main release branch, we will coordinate a public disclosure (and request a CVE if applicable) while giving full credit to the researcher.

---

## 🤝 Responsible Disclosure Policy

We ask that you follow these responsible disclosure principles:
* Give us a reasonable time frame to resolve the vulnerability before making details public.
* Avoid accessing, modifying, or destroying any user data that does not belong to you during your research.
* Do not perform denial-of-service (DoS) attacks or run high-frequency scanners that compromise system availability.
