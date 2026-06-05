module.exports = {
  apps: [
    {
      name: 'abj-shop',
      script: './src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
      },
      error_file: '/var/log/abj-shop/error.log',
      out_file: '/var/log/abj-shop/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      listen_timeout: 3000,
      kill_timeout: 5000,
      watch: false,
      ignore_watch: ['node_modules', 'data', 'uploads'],
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      cron_restart: '0 2 * * *', // Daily restart at 2 AM
    },
  ],
};
