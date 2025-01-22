module.exports = {
  apps: [
    {
      name: "lnkbrd",
      script: "node",
      args: "dist/main.js",
      instances: 1,
      watch: true,
    },
  ],
};
