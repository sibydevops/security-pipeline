# security-pipeline-demo

This repository contains a lightweight reusable security workflow. The local workflow runs on every push, pull request, and manual dispatch, then profiles the repository in about five seconds.

This repository starts its Node application ephemerally on the runner and scans `http://127.0.0.1:3000`, so no public target URL is needed. The reusable workflow runs CodeQL when a supported language is detected and ZAP only with an authorized target or ephemeral application. For organization-wide coverage, enable GitHub CodeQL default setup or an organization-required workflow. GitHub does not provide a central wildcard workflow that receives events from unrelated repositories.

For a no-cost organization-wide proof of concept, deploy the included webhook receiver to Render using [render.yaml](render.yaml), install its GitHub App across the organization, and configure the webhook URL as `https://YOUR-SERVICE.onrender.com/github/webhook`. Setup details and required secrets are in [IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md). Render's free service may sleep and is not suitable for guaranteed 10,000-repository production delivery.

Read [IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md) for organization rollout, repository onboarding, authorized penetration-test targets, OWASP methodology, governance, and scaling guidance.
For a no-cost local OWASP ZAP demonstration that requires no public URL, see [FREE-LOCAL-OWASP-SETUP.md](docs/FREE-LOCAL-OWASP-SETUP.md).
