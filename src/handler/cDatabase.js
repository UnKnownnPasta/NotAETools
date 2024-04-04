const { Sequelize } = require("sequelize");
const path = require("path");
const logger = require('./bLog.js');

class Database {
    constructor() {
        this.sequelize = new Sequelize({
            dialect: "sqlite",
            storage: path.join(__dirname, "..", "data/database.sqlite"),
            sync: false,
            // logging: (msg) => logger.info(msg),
            logging: false,
        });

        // Define models, associations, etc.
        this.defineModels();
    }

    defineModels() {
        this.models = {
            Relics: require('../models/relics.js')(this.sequelize),
            Items: require("../models/items.js")(this.sequelize),
            Resources: require("../models/resources.js")(this.sequelize),
            Farmers: require("../models/farmers.js")(this.sequelize),
            Treasurers: require("../models/treasurers.js")(this.sequelize),
        };
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            logger.info("Connection has been established successfully.");
        } catch (error) {
            logger.error("Unable to connect to the database:" + error.stack);
        }
    }

    async syncDatabase(with_force) {
        await this.sequelize.sync({ force: with_force });
    }
}

module.exports = new Database();
