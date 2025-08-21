const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      pid: process.pid
    }) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(this.logDir, filename);
    fs.appendFileSync(filePath, content);
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('INFO', message, meta);
    console.log(formatted.trim());
    this.writeToFile('app.log', formatted);
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('ERROR', message, meta);
    console.error(formatted.trim());
    this.writeToFile('error.log', formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('WARN', message, meta);
    console.warn(formatted.trim());
    this.writeToFile('app.log', formatted);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('DEBUG', message, meta);
      console.debug(formatted.trim());
      this.writeToFile('debug.log', formatted);
    }
  }

  http(req, res, duration) {
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode}`, meta);
    } else if (duration > 1000) {
      this.warn('Slow request', meta);
    } else {
      this.info('HTTP request', meta);
    }
  }
}

module.exports = new Logger();
