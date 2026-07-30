"use strict";

module.exports = {
  apps: [
    {
      name: "cook-and-fry",
      script: "./server.js",
      cwd: "/home/pasha/cook-and-fry",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        BASE_URL: "http://82.26.94.231"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        BASE_URL: "http://82.26.94.231"
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      merge_logs: true
    }
  ]
};
