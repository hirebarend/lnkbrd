<h3 align="center">Link Bird</h3>

<p align="center">
    An open-source API-first URL shortener
    <br />
    <a href="https://lnkbrd.com"><strong>Learn more »</strong></a>
    <br />
    <br />
    <a href="#introduction"><strong>Introduction</strong></a> ·
    <a href="#features"><strong>Features</strong></a> ·
    <a href="#get-started"><strong>Get Started</strong></a> ·
    <a href="#contributing"><strong>Contributing</strong></a>
</p>

<p align="center">
  <a href="https://github.com/hirebarend/lnkbrd/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/hirebarend/lnkbrd?label=license&logo=github&color=f80&logoColor=fff" alt="License" />
  </a>
</p>

<br/>

## Introduction

Link Bird is an open-source API-first URL shortener

## Features

- **Analytics**: Track every click with real-time analytics, offering detailed insights to understand your audience and optimize performance.
- **Geo-Targeting**: Redirect users to location-specific destinations, creating tailored experiences for a global audience.
- **Custom Open Graph**: Customize how your links appear on social media with personalized titles, descriptions, and thumbnails.
- **Time-Limited Links**: Set expiration dates for your links to ensure they remain active only as long as you need them.
- **Notifications**: Receive instant notifications for link events, enabling seamless automation with your favorite tools.

## Get Started

```bash
git clone https://github.com/hirebarend/lnkbrd.git

cd lnkbrd

npm install

npm run dev
```

## Deployment

```bash
curl -sSL https://raw.githubusercontent.com/hirebarend/lnkbrd/refs/heads/main/deploy.sh | bash -s -- lnkbrd.com https://github.com/hirebarend/lnkbrd.git

pm2 start /usr/src/app/lnkbrd-com/ecosystem.config.js
```

## Contributing

We love our contributors! Here's how you can contribute:

- [Open an issue](https://github.com/hirebarend/lnkbrd/issues) if you believe you've encountered a bug.
- Make a [pull request](https://github.com/hirebarend/lnkbrd/pull) to add new features/make quality-of-life improvements/fix bugs.

<br />

<a href="https://github.com/hirebarend/lnkbrd/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=hirebarend/lnkbrd&v=1" />
</a>

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/616bc192c7db2f2af8549094bc3a801da418e8a8.svg "Repobeats analytics image")

## License

Inspired by [Plausible](https://plausible.io/), Link Bird is open-source under the MIT License. You can [find it here](https://github.com/hirebarend/lnkbrd/blob/main/LICENSE).