module.exports = {
  apps: [
    {
      name: 'vision-backend',
      script: './src/server.js',
      cwd: '/var/www/VISION/backend',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 5005
      },
      error_file: '/var/log/pm2/vision-backend-error.log',
      out_file: '/var/log/pm2/vision-backend-out.log',
      log_file: '/var/log/pm2/vision-backend-combined.log',
      time: true,
      merge_logs: true
    },
    {
      name: 'vision-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/VISION',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      error_file: '/var/log/pm2/vision-frontend-error.log',
      out_file: '/var/log/pm2/vision-frontend-out.log',
      log_file: '/var/log/pm2/vision-frontend-combined.log',
      time: true,
      merge_logs: true
    }
  ]
};

