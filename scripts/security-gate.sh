#!/bin/bash

echo "Checking security findings..."

CRITICAL_COUNT=${CRITICAL_COUNT:-0}
HIGH_COUNT=${HIGH_COUNT:-0}
SECRETS_FOUND=${SECRETS_FOUND:-0}

if [ "$SECRETS_FOUND" -gt 0 ]; then
  echo "Secrets detected."
  exit 1
fi

if [ "$CRITICAL_COUNT" -gt 0 ]; then
  echo "Critical vulnerabilities detected."
  exit 1
fi

if [ "$HIGH_COUNT" -gt 0 ]; then
  echo "High vulnerabilities detected."
  exit 1
fi

echo "Security gate passed."
exit 0