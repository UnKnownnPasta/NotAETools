const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Relics extends Model {
    }
    Relics.init(
        {
            relic: { type: DataTypes.JSON, defaultValue: { "name": "", "tokens": "", "has": [] } },
            part1: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part2: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part3: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part4: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part5: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part6: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } }
        },
        { sequelize: sequelizeInstance, modelName: 'Relics', createdAt: false }
    );

    return Relics;
};
