#!/usr/bin/env bash
set -euo pipefail
out=${1:?output}; mkdir -p "$out"; chmod 777 "$out"
image=ghcr.io/zaproxy/zaproxy:stable
common=(--rm -v "$PWD/$out:/zap/wrk/:rw" "$image")
case "$DAST_MODE" in
 baseline) docker run "${common[@]}" zap-baseline.py -t "$TARGET_URL" -J zap.json -r zap.html -w zap.md -I || true ;;
 full) docker run "${common[@]}" zap-full-scan.py -t "$TARGET_URL" -J zap.json -r zap.html -w zap.md -I || true ;;
 api)
   spec=${OPENAPI_URL:-$TARGET_URL}
   docker run "${common[@]}" zap-api-scan.py -t "$spec" -f openapi -J zap.json -r zap.html -w zap.md -I || true ;;
 *) echo 'Unsupported mode'; exit 2 ;;
esac
test -s "$out/zap.json" || { echo '{"site":[]}' > "$out/zap.json"; }
