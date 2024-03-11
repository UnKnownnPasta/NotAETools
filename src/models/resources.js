const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Resources extends Model {
        // Accepts { clan: String, resource: {} } type data
        static async bulkUpdateResources(claninfo) {
            // Extract unique clan values from claninfo
            const uniqueClans = [...new Set(claninfo.map((res) => res.clan))];
        
            // Use transaction to ensure atomicity of the updates
            await this.sequelize.transaction(async (t) => {
                // Iterate over unique clan values
                for (const clan of uniqueClans) {
                    const resToUpdate = claninfo.find((res) => res.clan === clan);
        
                    // Use update with where clause for efficient updates
                    await this.update({ resource: resToUpdate.resource }, { where: { clan }, transaction: t });
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
