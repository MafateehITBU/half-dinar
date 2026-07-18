/** PM2 process file — API only (frontends are static Nginx). */
module.exports = {
  apps: [
    {
      name: 'abualnus-api',
      cwd: '/var/www/abualnus/apps/api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      time: true,
    },
  ],
};
