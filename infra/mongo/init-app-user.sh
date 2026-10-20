#!/bin/bash
# Runs once, on the first start with an empty volume, as root.
set -euo pipefail

mongosh --quiet admin -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" <<JS
db.getSiblingDB("farsh").createUser({
  user: "farsh_app",
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [{ role: "readWrite", db: "farsh" }],
});
JS
