const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class FarmIDs extends Model {
        // Accepts { name: String, uid: String, etc } type data
        static async bulkUpdateFarmInfo(userinfo) {
            await Promise.all(userinfo.map(async (res) => {
                // Use await to ensure that the update operation is complete before moving on
                await this.upsert({
                    uid: res.uid, name: res.name, ttltokens: res.ttltokens, bonus: res.bonus, spent: res.spent, left: res.left, playtime: res.playtime
                 }, { where: { uid: res.uid } }, { ignoreDuplicates: true });
            }));
        }
    }
    FarmIDs.init(
        {
            uid: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
            name: { type: DataTypes.STRING, defaultValue: "" },
            ttltokens: { type: DataTypes.STRING, defaultValue: "" },
            bonus: { type: DataTypes.STRING, defaultValue: "" },
            spent: { type: DataTypes.STRING, defaultValue: "" },
            left: { type: DataTypes.STRING, defaultValue: "" },
            playtime: { type: DataTypes.STRING, defaultValue: "" }
        },
        { sequelize: sequelizeInstance, modelName: 'FarmIDs' }
    );

    return FarmIDs;
};
