const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class RelicNames extends Model {
        static async bulkUpdateRelics(relicData) {
            const records = relicData.map(res => ({ name: res.name }));

            await this.bulkCreate(records, { updateOnDuplicate: ['name'], ignoreDuplicates: true });
        }
    }
    RelicNames.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "", primaryKey: true  }
        },
        { sequelize: sequelizeInstance, modelName: 'RelicNames', createdAt: false, updatedAt: false }
    );

    return RelicNames;
};
