const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Box extends Model {
        
    }
    Box.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            stock: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
        },
        { sequelize: sequelizeInstance, modelName: 'Box', createdAt: false, updatedAt: false }
    );

    return Box;
};
