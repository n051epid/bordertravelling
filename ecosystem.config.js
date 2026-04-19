// ecosystem.config.js - PM2 deployment configuration
// Usage: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'border-backend',
      cwd: '/data/apps/bordertravelling/backend',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'border-frontend',
      cwd: '/data/apps/bordertravelling/frontend',
      script: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3003',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
