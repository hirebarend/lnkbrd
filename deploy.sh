HOSTNAME=$1
SLUGIFIED_HOSTNAME=$(echo "$HOSTNAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g')

PORT=8080

while lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
    PORT=$((PORT + 1))
done

# <NGINX>
if ! dpkg -l | grep -q nginx; then
    apt update

    apt install -y nginx

    # ufw allow 80

    # ufw allow 443
fi
# </NGINX>

# <NODE JS>
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

    export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

    nvm install --lts
fi

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
# </NODE_JS>

mkdir -p /usr/src/app

if [ ! -d "/usr/src/app/$SLUGIFIED_HOSTNAME" ]; then
    git clone $2 /usr/src/app/$SLUGIFIED_HOSTNAME
else
    GIT_PULL_OUTPUT=$(git -C /usr/src/app/$SLUGIFIED_HOSTNAME pull)

    if echo "$GIT_PULL_OUTPUT" | grep -q "Already up to date."; then
        exit 0
    fi
fi

if [ ! -f "/usr/src/app/$SLUGIFIED_HOSTNAME/.env" ]; then
    if [ -f "/usr/src/app/.env" ]; then
        cp /usr/src/app/.env /usr/src/app/$SLUGIFIED_HOSTNAME/.env
    if

    echo "HOST=\"$HOSTNAME\"" >> .env
    echo "PORT=\"$PORT\"" >> .env
fi

if [ ! -f "/etc/nginx/conf.d/$SLUGIFIED_HOSTNAME.conf" ]; then
    cat <<EOF > /etc/nginx/conf.d/$SLUGIFIED_HOSTNAME.conf
server {
    listen 80;
    server_name $HOSTNAME;

    location / {
        proxy_pass http://127.0.0.1:$2;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    nginx -t

    systemctl reload nginx
fi

if [ -f "/usr/src/app/$SLUGIFIED_HOSTNAME/script.sh" ]; then
    chmod +x "/usr/src/app/$SLUGIFIED_HOSTNAME/script.sh"

    bash -c "cd '/usr/src/app/$SLUGIFIED_HOSTNAME' && ./script.sh"
fi