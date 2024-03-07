const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Resources extends Model {
        // Accepts { clan: String, resource: {} } type data
        static async bulkUpdateResources(claninfo) {
            await Promise.all(claninfo.map(async (res) => {
                // Use await to ensure that the update operation is complete before moving on
                await this.update({ resource: res.resource }, { where: { clan: res.clan } });
            }));
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
