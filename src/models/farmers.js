const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Farmers extends Model {

    }
    Farmers.init(
        {
            uid: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            name: { type: DataTypes.STRING, defaultValue: "" },
            tokens: { type: DataTypes.STRING, defaultValue: "" },
            bonus: { type: DataTypes.STRING, defaultValue: "" },
            spent: { type: DataTypes.STRING, defaultValue: "" },
            left: { type: DataTypes.STRING, defaultValue: "" },
            playtime: { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'Farmers' }
    );

    return Farmers;
};
