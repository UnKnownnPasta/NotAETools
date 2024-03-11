const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Resources extends Model {
        // Accepts { clan: String, resource: {} } type data
        static async bulkUpdateResources(claninfo) {
            const uniqueClans = [...new Set(claninfo.map((res) => res.clan))];
        
            await this.sequelize.transaction(async (t) => {
                for (const clan of uniqueClans) {
                    const resToUpdate = claninfo.find((res) => res.clan === clan);
        
                    await this.upsert({ resource: resToUpdate.resource }, { where: { clan }, transaction: t });
                }
            });
        }
        
    }
    Resources.init(
        {
            clan: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            resource: { type: DataTypes.JSON, defaultValue: {} }
        },
        { sequelize: sequelizeInstance, modelName: 'Resources', createdAt: false }
    );

    return Resources;
};
