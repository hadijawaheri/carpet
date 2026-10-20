#!/usr/bin/env bash
# One-time (and safe to re-run) hardening of an Ubuntu server for Farsh. Run as root from the repo:
#   sudo infra/server/setup.sh <deploy-user>
# - ufw: deny everything incoming except SSH, HTTP and HTTPS
# - systemd timer: daily MongoDB backup (scripts/backup-db.sh)
# - PM2: start on boot, rotate its logs (Caddy rolls its own, see infra/Caddyfile)
set -euo pipefail

deploy_user="${1:?usage: setup.sh <deploy-user>}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
ssh_port="${SSH_PORT:-22}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

echo "== Firewall"
apt-get install -y ufw >/dev/null
ufw default deny incoming
ufw default allow outgoing
# Rate-limited so password guessing gets cut off after 6 tries in 30 s
ufw limit "$ssh_port/tcp" comment "ssh"
ufw allow 80/tcp comment "http, redirects to https"
ufw allow 443/tcp comment "https"
ufw allow 443/udp comment "http/3"
ufw --force enable
ufw status verbose
# Docker writes its own iptables rules and bypasses ufw for published ports. Mongo is published on
# 127.0.0.1 only (infra/docker-compose.yml), and the API and web bind to 127.0.0.1, so nothing
# besides Caddy listens publicly; check with: ss -tlnp | grep -v 127.0.0.1

echo "== Daily database backup"
sed -e "s#@ROOT@#$root#g" -e "s#@USER@#$deploy_user#g" \
  "$root/infra/server/farsh-backup.service" > /etc/systemd/system/farsh-backup.service
cp "$root/infra/server/farsh-backup.timer" /etc/systemd/system/farsh-backup.timer
mkdir -p /var/backups/farsh
chown "$deploy_user" /var/backups/farsh
chmod 700 /var/backups/farsh
usermod -aG docker "$deploy_user"
systemctl daemon-reload
systemctl enable --now farsh-backup.timer

echo "== PM2 on boot and log rotation"
pm2_bin="$(sudo -iu "$deploy_user" which pm2)"
env PATH="$PATH:$(dirname "$pm2_bin")" "$pm2_bin" startup systemd -u "$deploy_user" \
  --hp "$(getent passwd "$deploy_user" | cut -d: -f6)"
sudo -iu "$deploy_user" pm2 install pm2-logrotate
sudo -iu "$deploy_user" pm2 set pm2-logrotate:max_size 20M
sudo -iu "$deploy_user" pm2 set pm2-logrotate:retain 14
sudo -iu "$deploy_user" pm2 set pm2-logrotate:compress true

echo "Done. Next backup: $(systemctl list-timers farsh-backup.timer --no-legend | awk '{print $1, $2}')"
