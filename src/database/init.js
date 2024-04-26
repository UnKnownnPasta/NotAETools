const { Sequelize } = require('sequelize');
const logger = require('../utils/logger.js');

class Database {
    constructor() {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: require('path').resolve(__dirname, '..', 'storage/database.sqlite'),
            sync: false,
            logging: false// (msg) => console.log(msg)
        });

        this.defineModels();
    }

    defineModels() {
        this.models = {
            Box: require('./models/boxData.js')(this.sequelize),
            Clans: require('./models/clanResources.js')(this.sequelize),
            Parts: require('./models/primeParts.js')(this.sequelize),
            Relics: require('./models/relicData.js')(this.sequelize),
            Users: require('./models/users.js')(this.sequelize),
            Tokens: require('./models/relicTokens.js')(this.sequelize)
        }
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            logger.info('SQL Connection has been established successfully.');
        } catch (error) {
            logger.error(error)
        }
    }

    async syncDatabase(withForce) {
        await this.sequelize.sync({ force: withForce });
    }
}

module.exports = new Database();
