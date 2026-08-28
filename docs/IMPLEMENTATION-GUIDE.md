# Common OWASP Security Workflow Implementation Guide

## Goal

Run a consistent security workflow for web, API, cloud-native, desktop, mobile, library, and infrastructure repositories.

The common workflow is:

```text
.github/workflows/common-owasp-security.yml
```

The caller template is not an active workflow while it is under `docs/`. Copy it into each application repository as:

```text
.github/workflows/organization-owasp-security.yml
```

## Important GitHub limitation

A workflow in `security-pipeline` cannot receive `push` or `pull_request` events from other repositories. GitHub evaluates those events in the repository containing the workflow file.

Therefore, scans for every push and pull request across repositories require organization-level configuration:

1. Use the GitHub App plus central event receiver included in this repository when custom OWASP scans must run without repository edits.
2. Enable CodeQL default setup for repositories that need source scanning.
3. Use GitHub Enterprise Cloud required workflows/rulesets where available for pull-request enforcement.
4. Use scheduled polling for delayed scans without repository workflow files.

The reusable workflow is the shared implementation, but it is not itself an organization-wide event listener. The included receiver provides that missing event layer. CodeQL default setup remains the GitHub-native option for automatic source scanning; it runs in each repository and stores results against that repository.

## Step 1: Prepare the central repository

Keep the common workflow in the central repository and pin its reference to a reviewed release tag instead of `main` for production:

```text
sibydevops/security-pipeline/.github/workflows/common-owasp-security.yml
```

Review all third-party actions and pin versions or commit SHAs according to organization supply-chain policy.

Deploy the webhook receiver from this repository to a free Render web service using [render.yaml](../render.yaml). Render provides the service URL after deployment. Free services can sleep and have usage limits, so use a paid or managed queue-backed service for reliable 10,000-repository production volume.

Create a GitHub App in the organization and install it on all repositories to be scanned. Enable `Push` and `Pull request` webhook events and grant:

- Repository metadata: read-only.
- Contents: read-only.
- Actions: read and write for `security-pipeline`.

Configure the App webhook URL as:

```text
https://YOUR-RENDER-SERVICE.onrender.com/github/webhook
```

Add these Render environment variables in **Dashboard > Service > Environment**:

```text
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY=complete-new-private-key
GITHUB_WEBHOOK_SECRET=new-webhook-secret
CENTRAL_REPOSITORY=sibydevops/security-pipeline
CENTRAL_WORKFLOW_ID=central-security-dispatch.yml
CENTRAL_WORKFLOW_REF=main
```

Add `SECURITY_APP_ID` and `SECURITY_APP_PRIVATE_KEY` as GitHub Actions secrets in [security-pipeline](https://github.com/sibydevops/security-pipeline/settings/secrets/actions). These are used by the central workflow to create a repository installation token.

## Step 2: Install the caller

For a repository where you have write access, create:

```text
.github/workflows/organization-owasp-security.yml
```

Copy the contents of:

```text
docs/application-security-caller.yml
```

The caller runs on:

```yaml
on:
  push:
  pull_request:
  workflow_dispatch:
```

If you cannot write to 10,000 repositories, install the GitHub App at organization scope. A central repository workflow cannot receive cross-repository events without this event receiver or organization-required workflow configuration.

## Step 3: Choose application profile

The common workflow accepts:

```text
web
api
cloud-native
desktop
mobile
library
infrastructure
auto
```

Use `auto` initially. Replace it with an explicit profile when repository metadata is available. Explicit profiles are more reliable than filename heuristics.

Examples:

```yaml
with:
  application-type: api
  run-zap: true
  target-url: https://api-staging.example.test
```

```yaml
with:
  application-type: cloud-native
  run-zap: true
  target-url: https://service-staging.example.test
```

## Step 4: Configure OWASP scans

The common workflow runs CodeQL when a supported source language is detected on every push and pull request. OWASP ZAP is optional: it runs only when an authorized HTTP target or ephemeral application is configured. With no target URL, the source security checks still run and active testing is reported as not applicable.

CodeQL result upload requires GitHub code scanning/Advanced Security to be enabled. Set the caller input `upload-codeql-results: true` (or repository variable `CODEQL_UPLOAD_RESULTS=true`) when that feature is available. Otherwise, set it to `false` so CodeQL still analyzes the source without failing during SARIF upload.

### Web applications

Use:

- OWASP Dependency-Check
- OWASP ZAP baseline scan
- CodeQL source analysis where the language is supported

ZAP requires an authorized non-production URL:

```yaml
with:
  application-type: web
  run-zap: true
  target-url: https://staging.example.test
```

Do not use a placeholder target. Configure `OWASP_TARGET_URL` only for an authorized non-production target, or provide `start-command` and `health-url` for an approved ephemeral deployment.

### APIs

Use:

- OWASP API Security Top 10 2023
- OWASP ZAP API testing from an OpenAPI definition
- Dependency-Check
- OpenAPI/schema-driven tests
- Authentication and authorization test cases

API tests require an authorized API URL and test credentials. Never put credentials in workflow YAML or event payloads.

### Cloud-native applications

Use:

- Dependency-Check
- Trivy configuration, secret, and vulnerability scanning
- Kubernetes manifest and IaC scanning through the repository filesystem scan
- ZAP/API testing against an isolated deployed service when applicable

### Desktop applications

Use:

- Dependency and SBOM analysis
- Source analysis
- Signing and update-mechanism review
- Local IPC/plugin/configuration testing

ZAP is normally not applicable unless the desktop application exposes an HTTP service.

### Mobile applications

Use:

- Dependency and SBOM analysis
- Android/iOS manifest and configuration review
- Static source analysis
- Emulator/device testing under a separate mobile test plan

### Libraries and infrastructure

Use dependency, SBOM, source, IaC, configuration, and package-publication controls. Mark active web penetration testing as `not applicable` unless an authorized test harness exposes an HTTP service.

## Step 5: Use OWASP methodology

Use the OWASP Web Security Testing Guide for web applications and the OWASP API Security Top 10 for APIs.

A penetration test consists of:

1. Written authorization and scope.
2. Asset and trust-boundary discovery.
3. Threat modeling and abuse cases.
4. Automated testing.
5. Manual validation of important findings.
6. Evidence, severity, and remediation mapping.
7. Retesting after fixes.

Use versioned WSTG scenario IDs in evidence. Use the OWASP Top 10 for risk communication, not as a complete test plan.

## Step 6: Handle active testing targets

OWASP ZAP and API testing need a running HTTP target. Use one of:

- Dedicated staging environment.
- Temporary isolated deployment.
- Application started on the GitHub runner.

If there is no target, the workflow skips active testing and reports it as `not applicable`. It must not claim that active penetration testing passed.

## Step 7: Configure GitHub security

An organization owner should:

- Enable GitHub Actions.
- Enable code scanning where applicable.
- Approve reusable workflow access.
- Configure repository rulesets.
- Require the security check before protected-branch merges.
- Define severity thresholds and remediation deadlines.
- Provide an exception/break-glass process.

Do not run advanced CodeQL if organization-managed default setup is enabled for the same repository. Choose one CodeQL configuration.

## Step 8: Test one repository of each type

Use representative repositories:

- ASP.NET or Flask API.
- React or Node web application.
- Go service.
- Java service.
- Desktop project.
- Cloud-native project.
- Library.

For each test:

1. Push a harmless commit.
2. Confirm the workflow starts.
3. Confirm the correct profile.
4. Confirm Dependency-Check runs.
5. Confirm ZAP only runs with an authorized URL.
6. Open a pull request.
7. Push another commit to the pull request.
8. Confirm a new run uses the new commit SHA.
9. Review artifacts and findings.
10. Validate failure, retry, and exception behavior.

## Step 9: Scale to 10,000 repositories

Do not run 10,000 scans synchronously from one workflow job. Use:

- Event queue or scheduled batches.
- Repository/SHA idempotency keys.
- Delivery deduplication.
- Pull request priority.
- Concurrency limits.
- GitHub API rate-limit handling.
- Retry and dead-letter handling.
- Cancellation of obsolete commit scans.
- Central coverage and failure dashboards.
- Periodic reconciliation for missed events.

For automatic source scanning without modifying every repository, use CodeQL default setup or the included GitHub App receiver. The central dispatch workflow runs source/dependency checks for the affected commit. ZAP still requires an authorized target or ephemeral application; it cannot scan an unknown application without a runtime target.

## Training

Use official OWASP material as the normative reference:

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [OWASP API Security Project](https://owasp.org/www-project-api-security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ZAP](https://www.zaproxy.org/)

LinkedIn Learning search results include courses such as:

- [Offensive Penetration Testing](https://www.linkedin.com/learning/offensive-penetration-testing)
- [Penetration Testing Essential Training](https://www.linkedin.com/learning/penetration-testing-essential-training-24352676)
- [Security Testing Essential Training](https://www.linkedin.com/learning/security-testing-essential-training-26279403)
- [Dynamic Application Security Testing](https://www.linkedin.com/learning/dynamic-application-security-testing)
- [Application Security Testing and Debugging](https://www.linkedin.com/learning/application-security-testing-and-debugging)

Availability may require a LinkedIn Learning subscription or vary by region. Training does not replace an approved scope, test plan, or manual penetration test.
