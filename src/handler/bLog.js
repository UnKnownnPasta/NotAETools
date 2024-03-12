const chalk = require('chalk');

class logger {
    constructor(name) {
        this.name = name;
    }

    log(level, message) {
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        console.log(this.getColor(level)(formattedMessage));
    }

    info(message) {
        this.log('info', message);
    }

    event(message) {
        this.log('event', message)
    }

    warn(message) {
        this.log('warn', message);
    }

    error(message) {
        this.log('error', message);
    }

    anticrash(message) {
        this.log('anti crash', message)
    }

    getColor(level) {
        switch (level) {
            case 'info':
                return chalk.blue;
            case 'warn':
                return chalk.yellow;
            case 'event':
                return chalk.blueBright;
            case 'error':
            case 'anti crash':
                return chalk.red.bold;
            default:
                return chalk.white;
        }
    }
}

module.exports = new logger('AETools');