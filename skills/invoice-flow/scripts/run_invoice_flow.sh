#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_APP_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
APP_DIR="${INVOICE_FLOW_DIR:-$DEFAULT_APP_DIR}"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "Invoice Flow app not found. Set INVOICE_FLOW_DIR to the repo root." >&2
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: run_invoice_flow.sh <generate|validate|preview> [args...]" >&2
  exit 1
fi

CMD="$1"
shift

cd "$APP_DIR"

if [[ ! -d "node_modules" ]]; then
  npm install >/dev/null
fi

case "$CMD" in
  generate|validate|preview)
    npm run "$CMD" -- "$@"
    ;;
  *)
    echo "Unsupported command: $CMD" >&2
    exit 1
    ;;
esac
