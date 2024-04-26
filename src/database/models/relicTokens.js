const { DataTypes, Model } = require('sequelize')

module.exports = (sequelizeInstance) => {
    class relicTokens extends Model {}
    relicTokens.init(
        {
            relic: { type: DataTypes.STRING, defaultValue: '', primaryKey: true },
            tokens: { type: DataTypes.STRING, defaultValue: "0" },
        },
        { sequelize: sequelizeInstance, modelName: 'relicTokens', createdAt: false, updatedAt: false }
    )

    return relicTokens
}
