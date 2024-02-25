const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Parts extends Model {
    }
    Parts.init(
        {
            part: { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'Parts', createdAt: false }
    );

    return Parts;
};
