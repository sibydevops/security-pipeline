const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const githubApiVersion = '2022-11-28';
const pullRequestActions = new Set(['opened', 'reopened', 'synchronize', 'ready_for_review']);

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function verifySignature(rawBody, signature) {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', requiredEnvironment('GITHUB_WEBHOOK_SECRET'))
    .update(rawBody)
    .digest('hex');
  const actual = signature.slice('sha256='.length);

  return actual.length === expected.length && crypto.timingSafeEqual(
    Buffer.from(actual),
    Buffer.from(expected)
  );
}

function createAppToken(installationId) {
  const appId = requiredEnvironment('GITHUB_APP_ID');
  const privateKey = requiredEnvironment('GITHUB_APP_PRIVATE_KEY').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const appJwt = jwt.sign({
    iat: now - 60,
    exp: now + 540,
    iss: appId
  }, privateKey, { algorithm: 'RS256' });

  return fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${appJwt}`,
      'X-GitHub-Api-Version': githubApiVersion
    }
  }).then(async response => {
    if (!response.ok) {
      throw new Error(`GitHub installation token request failed: ${response.status}`);
    }
    return response.json();
  });
}

async function dispatchScan(eventName, payload) {
  const repository = payload.repository.full_name;
  const installationId = payload.installation && payload.installation.id;
  if (!installationId) {
    throw new Error('Webhook payload does not contain an installation id');
  }

  const isPullRequest = eventName === 'pull_request';
  const ref = isPullRequest
    ? `refs/pull/${payload.number}/merge`
    : payload.ref;
  const sha = isPullRequest ? payload.pull_request.head.sha : payload.after;
  const tokenResponse = await createAppToken(installationId);
  const workflowRepository = requiredEnvironment('CENTRAL_REPOSITORY');
  const workflowId = process.env.CENTRAL_WORKFLOW_ID || 'central-security-dispatch.yml';
  const workflowRef = process.env.CENTRAL_WORKFLOW_REF || 'main';

  const response = await fetch(`https://api.github.com/repos/${workflowRepository}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenResponse.token}`,
      'X-GitHub-Api-Version': githubApiVersion,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: workflowRef,
      inputs: {
        repository,
        ref,
        sha,
        event: eventName
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Central workflow dispatch failed: ${response.status}`);
  }
}

function registerGithubWebhook(app) {
  app.post('/github/webhook', require('express').raw({ type: 'application/json' }), async (request, response) => {
    const rawBody = request.body;
    if (!Buffer.isBuffer(rawBody) || !verifySignature(rawBody, request.get('x-hub-signature-256'))) {
      response.status(401).send('Invalid webhook signature');
      return;
    }

    const eventName = request.get('x-github-event');
    if (eventName !== 'push' && eventName !== 'pull_request') {
      response.status(202).send('Event ignored');
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
      if (eventName === 'pull_request' && !pullRequestActions.has(payload.action)) {
        response.status(202).send('Pull request action ignored');
        return;
      }
      await dispatchScan(eventName, payload);
      response.status(202).send('Scan dispatched');
    } catch (error) {
      console.error(error.message);
      response.status(500).send('Unable to dispatch scan');
    }
  });
}

module.exports = { registerGithubWebhook };
