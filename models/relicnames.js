const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class RelicNames extends Model {
        // Class-level method
        static async findByName(relic_name) {
            return this.findOne({ where: { name: relic_name } });
        }

        // Instance-level method
        getDisplayName() {
            return `Relic: ${this.name}`;
        }
    }
    RelicNames.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'RelicNames', createdAt: false, updatedAt: false }
    );

    return RelicNames;
};
