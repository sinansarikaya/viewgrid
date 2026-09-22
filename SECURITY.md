# Security Policy

ViewGrid is built with a security-focused, privacy-first browser extension architecture. All processing executes locally within your browser sandbox—zero remote servers, zero analytics, and zero telemetry.

---

## Reporting a Vulnerability

We take the security and privacy of ViewGrid seriously. If you believe you have discovered a security vulnerability or sensitive permission issue, please report it responsibly:

- **Private Security Advisory:** Submit directly via [GitHub Security Advisory](https://github.com/sinansarikaya/viewgrid/security/advisories/new) (preferred).
- **Direct Email:** Alternatively, email [security@sinansarikaya.dev](mailto:security@sinansarikaya.dev) or [contact@sinansarikaya.dev](mailto:contact@sinansarikaya.dev).

Please **do not** report security vulnerabilities through public GitHub Issues or public pull requests until we have had an opportunity to address them.

### What to Include in Your Report

To help us triage and resolve the issue quickly, please provide:
1. Description of the vulnerability and its potential impact.
2. Steps to reproduce the issue (including sample URLs, manifests, or browser configurations).
3. Browser version (Chromium or Firefox) and ViewGrid version.
4. Any potential remediation or patch you recommend.

### Response Time

- We acknowledge reports within **48 hours**.
- We aim to provide an initial assessment and target resolution timeline within **7 business days**.
- Once a fix is verified, a patched release will be published and credited in our release notes (unless you request anonymity).

---

## Detailed Security Architecture & Threat Model

For an in-depth breakdown of our permission scopes, DeclarativeNetRequest rules, and framing security architecture, please read our full specification:

👉 [**docs/SECURITY.md**](docs/SECURITY.md)
