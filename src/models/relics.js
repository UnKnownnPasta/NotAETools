const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Relics extends Model {
        // Accepts { relic: String, partx: JSON, etc } type data
        static async bulkUpdateRelics(relicData) {
            const relicMap = new Map();
        
            relicData.forEach((res) => {
                const relic = res.relic;
                if (!relicMap.has(relic)) {
                    relicMap.set(relic, []);
                }
                relicMap.get(relic).push(res);
            });

            await this.sequelize.transaction(async (t) => {
                for (const [relic, recordsToUpdate] of relicMap.entries()) {
                    await this.bulkCreate(recordsToUpdate, {
                        updateOnDuplicate: ['part1', 'part2', 'part3', 'part4', 'part5', 'part6'],
                        transaction: t
                    });
                }
            });
        }
        
    }
    Relics.init(
        {
            relic: { type: DataTypes.JSON, defaultValue: { "name": "", "tokens": "", "has": [] }, primaryKey: true  },
            part1: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part2: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part3: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part4: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part5: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } },
            part6: { type: DataTypes.JSON, defaultValue: { "name": "", "count": "", "type": "" } }
        },
        { sequelize: sequelizeInstance, modelName: 'Relics', createdAt: false, updatedAt: false }
    );

    return Relics;
};
