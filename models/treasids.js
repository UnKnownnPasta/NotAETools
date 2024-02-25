const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class TreasIDs extends Model {
    }
    TreasIDs.init(
        {
            user: { type: DataTypes.STRING, defaultValue: "" },
            uid: { type: DataTypes.STRING, defaultValue: "" },
        },
        { sequelize: sequelizeInstance, modelName: 'TreasIDs' }
    );

    return TreasIDs;
};
