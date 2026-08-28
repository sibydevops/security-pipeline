# security-pipeline-demo

This repository contains a lightweight reusable security workflow. The local workflow runs on every push, pull request, and manual dispatch, then profiles the repository in about five seconds.

This repository starts its Node application ephemerally on the runner and scans `http://127.0.0.1:3000`, so no public target URL is needed. For other repositories, the caller workflow runs automatically on every push and pull request and performs CodeQL when a supported language is detected. ZAP is skipped when no authorized target or ephemeral start command is configured; set `OWASP_TARGET_URL` and enable `run-zap` when a staging target exists. GitHub Actions events are repository-scoped, so copy [application-security-caller.yml](docs/application-security-caller.yml) into each repository as `.github/workflows/organization-owasp-security.yml`, or configure it as an organization required workflow/GitHub App.

Read [IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md) for organization rollout, repository onboarding, authorized penetration-test targets, OWASP methodology, governance, and scaling guidance.
For a no-cost local OWASP ZAP demonstration that requires no public URL, see [FREE-LOCAL-OWASP-SETUP.md](docs/FREE-LOCAL-OWASP-SETUP.md).
