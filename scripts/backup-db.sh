#!/usr/bin/env bash
# Daily MongoDB backup: a gzipped archive per day, the last $KEEP_DAYS kept, optionally copied off
# the server. Installed as a systemd timer by infra/server/setup.sh.
#   BACKUP_DIR (default /var/backups/farsh), KEEP_DAYS (default 14),
#   BACKUP_REMOTE (optional rsync target such as user@host:/backups/farsh)
#   MONGO_PORT (default 27017, the native server from infra/server/setup-mongo.sh; 27018 for the
#   dev compose Mongo). Needs mongodump on the host (mongodb-database-tools).
# Reads MONGO_ROOT_PASSWORD from infra/.env; the app user cannot read users and roles.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck source=/dev/null
. "$root/infra/.env"
set +a

backup_dir="${BACKUP_DIR:-/var/backups/farsh}"
keep_days="${KEEP_DAYS:-14}"
stamp="$(date -u +%Y-%m-%dT%H%M%SZ)"
archive="$backup_dir/farsh-$stamp.archive.gz"

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"

mongodump --host 127.0.0.1 --port "${MONGO_PORT:-27017}" --username root \
  --password "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin --db farsh \
  --archive="$archive.partial" --gzip
mv "$archive.partial" "$archive"
chmod 600 "$archive"

find "$backup_dir" -name 'farsh-*.archive.gz' -mtime "+$keep_days" -delete

if [ -n "${BACKUP_REMOTE:-}" ]; then
  rsync -a --delete "$backup_dir/" "$BACKUP_REMOTE/"
fi

echo "Backup written: $archive ($(du -h "$archive" | cut -f1))"
