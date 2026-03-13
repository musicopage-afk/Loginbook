#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  for candidate in DATABASE_PRIVATE_URL POSTGRES_URL POSTGRES_PRISMA_URL POSTGRESQL_URL; do
    eval "candidate_value=\${$candidate:-}"
    if [ -n "${candidate_value:-}" ]; then
      export DATABASE_URL="$candidate_value"
      echo "Using $candidate for DATABASE_URL"
      break
    fi
  done
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Configure DATABASE_URL or one of: DATABASE_PRIVATE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL, POSTGRESQL_URL." >&2
  exit 1
fi

if [ "${RUN_MIGRATIONS_ON_START:-true}" = "true" ]; then
  npx prisma migrate deploy
fi

exec "$@"
