const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class FarmIDs extends Model {
    }
    FarmIDs.init(
        {
            "uid": { type: DataTypes.STRING, defaultValue: "" },
            "name": { type: DataTypes.STRING, defaultValue: "" },
            "ttltokens": { type: DataTypes.STRING, defaultValue: "" },
            "bonus": { type: DataTypes.STRING, defaultValue: "" },
            "spent": { type: DataTypes.STRING, defaultValue: "" },
            "left": { type: DataTypes.STRING, defaultValue: "" },
            "playtime": { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'FarmIDs' }
    );

    return FarmIDs;
};
