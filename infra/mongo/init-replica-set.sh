#!/usr/bin/env bash
# Initiates replica set rs0 and creates the root and farsh_app users; safe to re-run.
#   MONGO_ROOT_PASSWORD=… MONGO_APP_PASSWORD=… infra/mongo/init-replica-set.sh [port]
# The first run uses MongoDB's localhost exception (no users exist yet); later runs log in as root.
set -euo pipefail

port="${1:-27017}"
: "${MONGO_ROOT_PASSWORD:?}"
: "${MONGO_APP_PASSWORD:?}"

auth=(-u root -p "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin)
if mongosh --quiet --port "$port" "${auth[@]}" --eval "1" >/dev/null 2>&1; then
  export MONGO_HAS_ROOT=1
else
  auth=()
  export MONGO_HAS_ROOT=0
fi

export MONGO_PORT="$port"
mongosh --quiet --port "$port" "${auth[@]}" --eval '
try {
  rs.status();
} catch {
  rs.initiate({ _id: "rs0", members: [{ _id: 0, host: `127.0.0.1:${process.env.MONGO_PORT}` }] });
}
// User writes need a primary; a fresh set takes a moment to elect itself
for (let i = 0; i < 30 && !db.hello().isWritablePrimary; i++) sleep(1000);

const admin = db.getSiblingDB("admin");
if (process.env.MONGO_HAS_ROOT !== "1") {
  // The localhost exception allows exactly this: creating the first user
  admin.createUser({ user: "root", pwd: process.env.MONGO_ROOT_PASSWORD, roles: ["root"] });
  admin.auth("root", process.env.MONGO_ROOT_PASSWORD);
}
const farsh = db.getSiblingDB("farsh");
if (!farsh.getUser("farsh_app")) {
  farsh.createUser({
    user: "farsh_app",
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [{ role: "readWrite", db: "farsh" }],
  });
}
print(`replica set ${rs.status().set}, users ready`);
'
