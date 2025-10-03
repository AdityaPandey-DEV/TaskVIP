const fs = require('fs');
const path = require('path');

class ErrorLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logPaymentError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'PAYMENT_ERROR',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      severity: 'ERROR'
    };

    // Console logging
    console.error('Payment Error:', logEntry);

    // File logging
    const logFile = path.join(this.logDir, `payment-errors-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  logAdminAction(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ADMIN_ACTION',
      action,
      details,
      severity: 'INFO'
    };

    console.log('Admin Action:', logEntry);

    const logFile = path.join(this.logDir, `admin-actions-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }

  logSecurityEvent(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY_EVENT',
      event,
      details,
      severity: 'WARNING'
    };

    console.warn('Security Event:', logEntry);

    const logFile = path.join(this.logDir, `security-events-${new Date().toISOString().split('T')[0]}.log`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  }
}

module.exports = new ErrorLogger();
