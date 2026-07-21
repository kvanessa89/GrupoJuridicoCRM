#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ ! -x node_modules/.bin/playwright ]]; then
  cat >&2 <<'MSG'
No se encontró Playwright. Instálelo primero con:
  npm install
  npx playwright install chromium
MSG
  exit 2
fi

if [[ -z "${CRM_ADMIN_EMAIL:-}" || -z "${CRM_ADMIN_PASSWORD:-}" ]]; then
  cat >&2 <<'MSG'
Faltan CRM_ADMIN_EMAIL o CRM_ADMIN_PASSWORD.
Copie .env.example a .env y configure las credenciales (el archivo .env está ignorado por Git).
MSG
  exit 2
fi

mode="${1:-all}"
shift || true
case "$mode" in
  all) exec npx playwright test "$@" ;;
  browser) exec npx playwright test tests/clientes.browser.spec.ts "$@" ;;
  request) exec npx playwright test tests/clientes.request.spec.ts "$@" ;;
  list) exec npx playwright test --list "$@" ;;
  *)
    echo "Uso: ./run-playwright.sh [all|browser|request|list] [argumentos de Playwright]" >&2
    exit 2
    ;;
esac
