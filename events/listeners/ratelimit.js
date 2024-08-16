const logger = require("../../scripts/logger");

module.exports = {
    name: 'rateLimit',
    once: false,
    async listen(client, info) {
        logger.warn(`Rate limit hit! Timeout: ${info.timeout} ms, Limit: ${info.limit}, Method: ${info.method}, Path: ${info.path}`);
    }
}