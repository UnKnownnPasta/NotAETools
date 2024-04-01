const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Relics extends Model {
    }
    Relics.init(
        {
            relic: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            vaulted: { type: DataTypes.BOOLEAN, defaultValue: false },
            rewards: { type: DataTypes.JSON, defaultValue: {}, allowNull: false }
        },
        { sequelize: sequelizeInstance, modelName: 'Relics', createdAt: false, updatedAt: false }
    );

    return Relics;
};
