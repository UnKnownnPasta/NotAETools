const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Items extends Model {
        
    }
    Items.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            stock: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
            color: { type: DataTypes.STRING, defaultValue: "", allowNull: false }
        },
        { sequelize: sequelizeInstance, modelName: 'Items', createdAt: false, updatedAt: false }
    );

    return Items;
};
