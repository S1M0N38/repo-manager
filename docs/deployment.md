# Production Deployment

This guide covers deploying repo-manager to production on Linux systems.

## Systemd Service

repo-manager includes a systemd service unit for automatic startup and process management.

### Installation

```bash
# 1. Clone to /opt (or your preferred location)
sudo git clone <repository-url> /opt/repo-manager
cd /opt/repo-manager

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env with your values
nano .env

# 4. Set ownership
sudo chown -R www-data:www-data /opt/repo-manager

# 5. Copy service file
sudo cp docs/examples/repo-manager.service /etc/systemd/system/

# 6. Reload systemd
sudo systemctl daemon-reload

# 7. Enable and start
sudo systemctl enable repo-manager
sudo systemctl start repo-manager

# 8. Verify
sudo systemctl status repo-manager
```

### Service Configuration

The included `repo-manager.service` uses these defaults:

| Setting | Value |
|---------|-------|
| User/Group | `www-data` |
| Install path | `/opt/repo-manager` |
| Bun path | `/root/.bun/bin/bun` |

Check your bun path and adjust if needed:

```bash
which bun  # Common: /usr/local/bin/bun, /home/user/.bun/bin/bun
```

### Creating a Dedicated User (Recommended)

```bash
# Create system user without login shell
sudo useradd --system --no-create-home --shell /usr/sbin/nologin repo-manager

# Set ownership
sudo chown -R repo-manager:repo-manager /opt/repo-manager

# Update service file
sudo sed -i 's/User=www-data/User=repo-manager/' /etc/systemd/system/repo-manager.service
sudo sed -i 's/Group=www-data/Group=repo-manager/' /etc/systemd/system/repo-manager.service

# Reload and restart
sudo systemctl daemon-reload
sudo systemctl restart repo-manager
```

### Management Commands

| Command | Description |
|---------|-------------|
| `sudo systemctl start repo-manager` | Start the service |
| `sudo systemctl stop repo-manager` | Stop the service |
| `sudo systemctl restart repo-manager` | Restart the service |
| `sudo systemctl status repo-manager` | Check service status |
| `sudo systemctl enable repo-manager` | Enable start on boot |
| `sudo systemctl disable repo-manager` | Disable start on boot |
| `sudo journalctl -u repo-manager -f` | Follow logs |

### Security Hardening

The service includes these protections:

| Option | Purpose |
|--------|---------|
| `NoNewPrivileges=true` | Prevents privilege escalation |
| `ProtectSystem=strict` | Makes `/usr`, `/boot`, `/efi` read-only |
| `ProtectHome=true` | Hides `/home`, `/root`, `/run/user` |
| `ReadWritePaths=/opt/repo-manager` | Only allows writes to app directory |
| `PrivateTmp=true` | Uses private `/tmp` directory |

---

## Reverse Proxy (HTTPS)

For HTTPS with GitHub webhooks, use a reverse proxy.

### Caddy (Recommended)

Caddy provides automatic HTTPS via Let's Encrypt.

**Installation (Ubuntu/Debian):**

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

**Configuration:**

Create `/etc/caddy/Caddyfile`:

```
webhook.yourdomain.com {
    reverse_proxy localhost:3000
}
```

```bash
sudo systemctl reload caddy
```

### Nginx (Alternative)

```nginx
server {
    listen 443 ssl http2;
    server_name webhook.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/webhook.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webhook.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## GitHub Webhook Configuration

After deployment, configure your GitHub repository:

1. Go to **Settings > Webhooks > Add webhook**
2. Payload URL: `https://webhook.yourdomain.com/`
3. Content type: `application/json`
4. Secret: Same as `GITHUB_WEBHOOK_SECRET` in `.env`
5. Events: Select "Issues" (and others as needed)
6. Click "Add webhook"

GitHub will send a ping event to verify the connection.

---

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u repo-manager -n 50

# Common issues:
# - Wrong bun path: Check ExecStart in service file
# - Permission denied: Check User/Group owns WorkingDirectory
# - Missing .env: Ensure EnvironmentFile path is correct
```

### Webhook returns 401

- Verify `GITHUB_WEBHOOK_SECRET` matches GitHub webhook secret
- Check that the secret is correctly set in `.env`

### Labels not being applied

- Check OpenClaw gateway is running: `openclaw gateway status`
- Check OpenClaw logs: `openclaw gateway logs`
- Verify `gh` CLI is authenticated: `gh auth status`
- Verify the skill is installed: `ls ~/.openclaw/skills/github-labeler`
