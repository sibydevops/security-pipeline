# security-pipeline-demo

This repository contains a lightweight reusable security workflow. The local workflow runs on every push, pull request, and manual dispatch, then profiles the repository in about five seconds.

This repository starts its Node application ephemerally on the runner and scans `http://127.0.0.1:3000`, so no public target URL is needed. For other repositories, CodeQL runs when a supported language is detected and ZAP runs only with an authorized target or ephemeral application. To scan all organization repositories without editing each one, use an organization GitHub App/webhook to receive `push` and `pull_request` events and dispatch central scan jobs. GitHub Actions workflows are repository-scoped; the caller in [application-security-caller.yml](docs/application-security-caller.yml) is the fallback when a central event service is unavailable.

Read [IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md) for organization rollout, repository onboarding, authorized penetration-test targets, OWASP methodology, governance, and scaling guidance.
For a no-cost local OWASP ZAP demonstration that requires no public URL, see [FREE-LOCAL-OWASP-SETUP.md](docs/FREE-LOCAL-OWASP-SETUP.md).
