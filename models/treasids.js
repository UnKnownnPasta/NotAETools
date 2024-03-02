const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class TreasIDs extends Model {
        // Accepts { user: String, uid: String } type data
        static async bulkUpdateIDs(userinfo) {
            await Promise.all(userinfo.map(async (res) => {
                // Use await to ensure that the update operation is complete before moving on
                await this.upsert({ user: res.user, uid: res.uid }, { where: { uid: res.uid } }, { ignoreDuplicates: true });
            }));
        }
    }
    TreasIDs.init(
        {
            user: { type: DataTypes.STRING, defaultValue: "" },
            uid: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
        },
        { sequelize: sequelizeInstance, modelName: 'TreasIDs' }
    );

    return TreasIDs;
};
