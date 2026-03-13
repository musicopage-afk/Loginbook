#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  for candidate in DATABASE_PRIVATE_URL DATABASE_URL_UNPOOLED DATABASE_PUBLIC_URL POSTGRES_URL POSTGRES_PRISMA_URL POSTGRES_URL_NON_POOLING POSTGRESQL_URL; do
    eval "candidate_value=\${$candidate:-}"
    if [ -n "${candidate_value:-}" ]; then
      export DATABASE_URL="$candidate_value"
      echo "Using $candidate for DATABASE_URL"
      break
    fi
  done
fi

if [ -z "${DATABASE_URL:-}" ] && [ -n "${PGHOST:-}" ] && [ -n "${PGUSER:-}" ] && [ -n "${PGDATABASE:-}" ]; then
  export DATABASE_URL="$(node -e "const e=process.env; const url = new URL('postgresql://localhost'); url.hostname=e.PGHOST; url.port=e.PGPORT || '5432'; url.username=e.PGUSER; url.password=e.PGPASSWORD || ''; url.pathname='/' + e.PGDATABASE; url.searchParams.set('schema', e.PGSCHEMA || 'public'); process.stdout.write(url.toString());")"
  echo "Constructed DATABASE_URL from PGHOST/PGUSER/PGDATABASE"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:/app/data/loginbook.db"
  echo "Defaulted DATABASE_URL to SQLite at /app/data/loginbook.db"
fi

mkdir -p /app/data /app/uploads

if [ "${RUN_DB_PUSH_ON_START:-true}" = "true" ]; then
  npx prisma db push --accept-data-loss --skip-generate
fi

if [ "${RUN_SEED_ON_START:-true}" = "true" ]; then
  npm run prisma:seed
fi

exec "$@"
