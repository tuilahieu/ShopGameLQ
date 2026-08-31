const path = require("node:path");

module.exports = {
  apps: [{
    name: "shoplienquan-api",
    cwd: path.resolve(__dirname, "../../backend"),
    script: "src/server.js",
    instances: 1,
    exec_mode: "fork",
    autorestart: true,
    max_memory_restart: "300M",
    env: {
      NODE_ENV: "production",
    },
  }],
};
