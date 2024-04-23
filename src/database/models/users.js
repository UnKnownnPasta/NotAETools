const { DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Users extends Model {}
    Users.init(
        {
            uid: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            name: { type: DataTypes.STRING, defaultValue: "" },
        },
        { sequelize: sequelizeInstance, modelName: 'Users', createdAt: false, updatedAt: false }
    );

    return Users;
};