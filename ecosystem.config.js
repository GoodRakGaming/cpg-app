module.exports = {
  apps: [
    {
      name: 'cpg-backend',
      cwd: './backend',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'cpg-frontend',
      cwd: './frontend',
      script: './node_modules/.bin/next',
      args: 'start -H 0.0.0.0 -p 3001',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
