/** PM2 — staging API (port from apps/api/.env). */
module.exports = {
  apps: [
    {
      name: 'mawjood-api-staging',
      cwd: '/var/www/mawjood-staging/apps/api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'staging',
      },
      max_memory_restart: '512M',
      time: true,
    },
  ],
};
