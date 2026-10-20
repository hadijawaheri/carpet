#!/bin/bash
# A replica set with auth needs a key file shared by its members; one member still needs it.
set -euo pipefail

keyfile=/data/configdb/replica.key
if [ ! -f "$keyfile" ]; then
  openssl rand -base64 756 > "$keyfile"
fi
chmod 400 "$keyfile"
chown mongodb:mongodb "$keyfile"

exec docker-entrypoint.sh mongod --replSet rs0 --bind_ip_all --port 27018 --keyFile "$keyfile"
