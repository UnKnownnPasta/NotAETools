const { DataTypes, Model } = require('sequelize');

module.exports = (sequelizeInstance) => {
    class boxData extends Model {}
    boxData.init(
        {
            name: { type: DataTypes.STRING, defaultValue: '', primaryKey: true },
            stock: { type: DataTypes.STRING, defaultValue: '', allowNull: false }
        },
        { sequelize: sequelizeInstance, modelName: 'boxData', createdAt: false, updatedAt: false }
    );

    return boxData;
};
