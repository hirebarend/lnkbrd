#!/bin/sh -e

get_available_port() {
    local PORT=${1:-8080}

    while grep -r -q "proxy_pass http://127.0.0.1:$PORT" /etc/nginx/conf.d/* 2>/dev/null; do
        PORT=$((PORT + 1))
    done

    echo "$PORT"
}

if [ "$(id -u)" != 0 ];then
    exit 1
fi

HOSTNAME=$1
SLUGIFIED_HOSTNAME=$(echo "$HOSTNAME" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g')

PORT=$(get_available_port 8080)

if [ -f "/etc/nginx/conf.d/$SLUGIFIED_HOSTNAME.conf" ]; then
    PORT=$(grep -oP 'proxy_pass http://127.0.0.1:\K[0-9]+' "/etc/nginx/conf.d/$SLUGIFIED_HOSTNAME.conf")
fi

# <NGINX>
if ! dpkg -l | grep -q nginx; then
    apt update

    apt install -y nginx
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
    (cd /usr/src/app/$SLUGIFIED_HOSTNAME &&  git reset --hard)
    
    GIT_PULL_OUTPUT=$(git -C /usr/src/app/$SLUGIFIED_HOSTNAME pull)

    if echo "$GIT_PULL_OUTPUT" | grep -q "Already up to date."; then
        exit 0
    fi
fi

rm -f /usr/src/app/$SLUGIFIED_HOSTNAME/.env

if [ -f "/usr/src/app/.env" ]; then
    cp /usr/src/app/.env /usr/src/app/$SLUGIFIED_HOSTNAME/.env
fi

echo "HOST=\"$HOSTNAME\"" >> /usr/src/app/$SLUGIFIED_HOSTNAME/.env
echo "PORT=\"$PORT\"" >> /usr/src/app/$SLUGIFIED_HOSTNAME/.env


if [ ! -f "/etc/nginx/conf.d/$SLUGIFIED_HOSTNAME.conf" ]; then
    cat <<EOF > /etc/nginx/conf.d/$SLUGIFIED_HOSTNAME.conf
server {
    listen 80;
    server_name $HOSTNAME;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
        add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";

        if (\$request_method = OPTIONS) {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS, PUT, DELETE";
            add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization";
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
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
