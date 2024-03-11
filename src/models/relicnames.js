const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class RelicNames extends Model {
        // Accepts { name: String } type data
        static async bulkUpdateRelics(relicData) {
            const records = relicData.map(res => ({ name: res.name }));
        
            // Assuming your model has a unique constraint on the 'name' column
            const uniqueKeys = ['name'];
        
            await this.bulkCreate(records, { updateOnDuplicate: uniqueKeys, ignoreDuplicates: true });
        }
    }
    RelicNames.init(
        {
            name: { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'RelicNames', createdAt: false, updatedAt: false }
    );

    return RelicNames;
};
