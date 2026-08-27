# security-pipeline-demo

This repository contains a lightweight reusable security workflow. The local workflow runs on every push, pull request, and manual dispatch, then profiles the repository in about five seconds.

GitHub Actions events are repository-scoped. This workflow cannot automatically receive pushes from every repository in an organization. To scan every repository, copy [application-security-caller.yml](docs/application-security-caller.yml) into each repository as `.github/workflows/organization-owasp-security.yml`, or configure it as an organization required workflow/GitHub App.

Read [IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md) for organization rollout, repository onboarding, authorized penetration-test targets, OWASP methodology, governance, and scaling guidance.
For a no-cost local OWASP ZAP demonstration that requires no public URL, see [FREE-LOCAL-OWASP-SETUP.md](docs/FREE-LOCAL-OWASP-SETUP.md).
