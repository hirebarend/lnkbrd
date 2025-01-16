# Link Bird

## Get Started

### Prerequisites

```bash
curl -sSL https://raw.githubusercontent.com/hirebarend/digital-ocean-deployment-kit/refs/heads/main/src/pre-install.sh | bash
```

### Install

```bash
curl -sSL https://raw.githubusercontent.com/hirebarend/digital-ocean-deployment-kit/refs/heads/main/src/install.sh | bash -s -- lnkbrd.com https://github.com/hirebarend/lnkbrd.git

curl -sSL https://raw.githubusercontent.com/hirebarend/digital-ocean-deployment-kit/refs/heads/main/src/certbot.sh | bash -s -- lnkbrd.com hirebarend@gmail.com

pm2 restart "lnkbrd-com" --update-env
```