module.exports = {
  apps: [
    {
      name: "admin",
      cwd: "./apps/admin",
      script: "npm",
      args: "run start -- --hostname 127.0.0.1 --port 3001",
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      autorestart: true,
      max_restarts: 5,
      time: true,
    },
    {
      name: "backend",
      cwd: "./apps/backend",
      script: "npm",
      args: "run start",
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
      },
      autorestart: true,
      max_restarts: 5,
      time: true,
    },
  ],
};

