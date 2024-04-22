const { DataTypes, Model } = require('sequelize')

module.exports = (sequelizeInstance) => {
    class relicData extends Model {
    }
    relicData.init(
        {
            relic: { type: DataTypes.STRING, defaultValue: '', primaryKey: true },
            vaulted: { type: DataTypes.BOOLEAN, defaultValue: false },
            rewards: { type: DataTypes.JSON, defaultValue: {}, allowNull: false }
        },
        { sequelize: sequelizeInstance, modelName: 'relicData', createdAt: false, updatedAt: false }
    )

    return relicData
}
