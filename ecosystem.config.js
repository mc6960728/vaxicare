
module.exports = {

  apps: [
    {
      name: 'vaxicare-backend-nodejs',
      script: './dist/server.js',
      instances: 1,           // use 'max' for cluster
      exec_mode: 'fork',      // or 'cluster'
      env: {
        PORT: process.env.PORT ,
        NODE_ENV: 'production'
      }
    }
  ]
};
