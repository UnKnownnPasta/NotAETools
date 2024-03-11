const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Parts extends Model {
        // Accepts { part: String } type data
        static async bulkUpdateParts(relicData) {
            const uniqueParts = [...new Set(relicData.map(res => res.part))];

            await this.sequelize.transaction(async (t) => {
                await Promise.all(uniqueParts.map(async (part) => {
                    const recordsToUpdate = relicData.filter(res => res.part === part);
        
                    await this.bulkCreate(recordsToUpdate, {
                        updateOnDuplicate: ['part'],
                        transaction: t
                    });
                }));
            });
        }
    }
    Parts.init(
        {
            part: { type: DataTypes.STRING, defaultValue: "", primaryKey: true }
        },
        { sequelize: sequelizeInstance, modelName: 'Parts', createdAt: false, updatedAt: false }
    );

    return Parts;
};
