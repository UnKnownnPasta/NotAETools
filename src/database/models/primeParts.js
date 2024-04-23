const { DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class primeParts extends Model {
        
    }
    primeParts.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            stock: { type: DataTypes.STRING, defaultValue: "", allowNull: false },
            color: { type: DataTypes.STRING, defaultValue: "", allowNull: false }
        },
        { sequelize: sequelizeInstance, modelName: 'primeParts', createdAt: false, updatedAt: false }
    );

    return primeParts;
};