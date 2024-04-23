const { DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class clanResources extends Model {}
    clanResources.init(
        {
            clan: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            resource: { type: DataTypes.JSON, defaultValue: {} }
        },
        { sequelize: sequelizeInstance, modelName: 'clanResources', createdAt: false }
    );

    return clanResources;
};