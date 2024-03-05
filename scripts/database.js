const { Sequelize } = require("sequelize");
const path = require("path");
const { info } = require("../scripts/utility.js");

class Database {
    constructor() {
        this.sequelize = new Sequelize({
            dialect: "sqlite",
            storage: path.join(process.cwd(), "data/database.sqlite"),
            sync: false,
            logging: (msg) => info("SQL", msg),
            // logging: false
        });

        // Define models, associations, etc.
        this.defineModels();
    }

    defineModels() {
        this.models = {
            Relics: require("../models/relics.js")(this.sequelize),
            Parts: require("../models/parts.js")(this.sequelize),
            RelicNames: require("../models/relicnames.js")(this.sequelize),
            FarmerIds: require("../models/farmerids.js")(this.sequelize),
            Resources: require("../models/resources.js")(this.sequelize),
            TreasIds: require("../models/treasids.js")(this.sequelize),
        };
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            console.log("Connection has been established successfully.");
        } catch (error) {
            console.error("Unable to connect to the database:", error);
        }
    }

    async syncDatabase() {
        // Sync your models with the database
        await this.sequelize.sync({ force: false }); // Set force to true for development, use migrations in production
    }
}

module.exports = new Database();
