const { Sequelize } = require("sequelize");

class Database {
    constructor() {
        this.sequelize = new Sequelize({
            dialect: "sqlite",
            storage: require("path").resolve(__dirname, "..", "storage/database.sqlite"),
            sync: false,
            logging: (msg) => console.log(msg),
        });

        this.defineModels();
    }

    defineModels() {
        this.models = {
            Box: require('./models/boxData.js')(this.sequelize),
            Clans: require('./models/clanResources.js')(this.sequelize),
            Parts: require('./models/primeParts.js')(this.sequelize),
            Relics: require('./models/relicData.js')(this.sequelize),
            Users: require('./models/users.js')(this.sequelize)
        }
    }

    async authenticate() {
        try {
            await this.sequelize.authenticate();
            console.log("Connection has been established successfully.");
        } catch (error) {
            console.log(error);
        }
    }

    async syncDatabase(with_force) {
        await this.sequelize.sync({ force: with_force });
    }
}

module.exports = new Database();