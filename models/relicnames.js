const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class RelicNames extends Model {
    }
    RelicNames.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'RelicNames', createdAt: false }
    );

    return RelicNames;
};
