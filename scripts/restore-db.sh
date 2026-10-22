#!/usr/bin/env bash
# Restores one archive from scripts/backup-db.sh into the farsh database, replacing its collections.
#   scripts/restore-db.sh /var/backups/farsh/farsh-2026-10-20T000000Z.archive.gz
#   MONGO_PORT as in scripts/backup-db.sh
set -euo pipefail

archive="${1:?usage: restore-db.sh <archive.gz>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck source=/dev/null
. "$root/infra/.env"
set +a

mongorestore --host 127.0.0.1 --port "${MONGO_PORT:-27017}" --username root \
  --password "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --nsInclude 'farsh.*' --drop \
  --archive="$archive" --gzip
