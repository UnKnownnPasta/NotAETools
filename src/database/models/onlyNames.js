const { DataTypes, Model } = require('sequelize');

module.exports = (sequelizeInstance) => {
    class onlyNames extends Model {}
    onlyNames.init(
        {
            name: { type: DataTypes.STRING, defaultValue: '', primaryKey: true }
        },
        { sequelize: sequelizeInstance, modelName: 'onlyNames', createdAt: false, updatedAt: false }
    );

    return onlyNames;
};
