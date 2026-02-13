function healthCheck() {
  return { status: 'healthy', timestamp: new Date().toISOString() };
}

function getStatus() {
  return {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  };
}

module.exports = { healthCheck, getStatus };
