#!/usr/bin/env bash
# One-time (and safe to re-run) install of MongoDB 8 on the Ubuntu server, natively and without
# Docker (docs/adr/0010). Run as root from the repo after filling infra/.env:
#   sudo infra/server/setup-mongo.sh
# - mongodb-org and the database tools (mongodump for scripts/backup-db.sh) from MongoDB's apt repo
# - infra/mongo/mongod.conf: 127.0.0.1:27017, replica set rs0, auth with a key file
# - users: root (backups, admin) and farsh_app (readWrite on farsh only, used by the API)
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi
set -a
# shellcheck source=/dev/null
. "$root/infra/.env"
set +a
: "${MONGO_ROOT_PASSWORD:?set MONGO_ROOT_PASSWORD in infra/.env}"
: "${MONGO_APP_PASSWORD:?set MONGO_APP_PASSWORD in infra/.env}"

echo "== Packages"
if ! command -v mongod >/dev/null; then
  apt-get install -y gnupg curl >/dev/null
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc |
    gpg --dearmor --yes -o /usr/share/keyrings/mongodb-server-8.0.gpg
  codename="$(. /etc/os-release && echo "$VERSION_CODENAME")"
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu $codename/mongodb-org/8.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update >/dev/null
  apt-get install -y mongodb-org >/dev/null
fi

echo "== Config"
if [ ! -f /etc/mongod.key ]; then
  openssl rand -base64 756 > /etc/mongod.key
fi
chown mongodb:mongodb /etc/mongod.key
chmod 400 /etc/mongod.key
install -m 644 "$root/infra/mongo/mongod.conf" /etc/mongod.conf
systemctl enable mongod
systemctl restart mongod

for _ in $(seq 30); do
  mongosh --quiet --eval "db.runCommand({ ping: 1 }).ok" >/dev/null 2>&1 && break
  sleep 1
done

echo "== Replica set and users"
MONGO_ROOT_PASSWORD="$MONGO_ROOT_PASSWORD" MONGO_APP_PASSWORD="$MONGO_APP_PASSWORD" \
  "$root/infra/mongo/init-replica-set.sh" 27017

echo "Done. DATABASE_URL for apps/api/.env:"
echo "  mongodb://farsh_app:<MONGO_APP_PASSWORD>@127.0.0.1:27017/farsh?replicaSet=rs0&authSource=farsh"
