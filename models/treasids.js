const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class TreasIDs extends Model {
        // Accepts { user: String, uid: String } type data
        static async bulkUpdateIDs(userinfo) {
            await Promise.all(userinfo.map(async (res) => {
                // Use await to ensure that the update operation is complete before moving on
                await this.update({ uid: res.uid, user: res.user }, { where: { uid: `${res.uid}` } });
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
