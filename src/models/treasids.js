const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class TreasIDs extends Model {
        // Accepts { user: String, uid: String } type data
        static async bulkUpdateIDs(userinfo) {
            const uniqueUIDs = [...new Set(userinfo.map((res) => res.uid))];

            await this.sequelize.transaction(async (t) => {
                for (const uid of uniqueUIDs) {
                    const userToUpdate = userinfo.find((res) => res.uid === uid);
        
                    await this.upsert({ uid: userToUpdate.uid, user: userToUpdate.user }, { where: { uid }, transaction: t });
                }
            });
        }
        
    }
    TreasIDs.init(
        {
            user: { type: DataTypes.STRING, defaultValue: "" },
            uid: { type: DataTypes.STRING, defaultValue: "", primaryKey: true },
        },
        { sequelize: sequelizeInstance, modelName: 'TreasIDs', createdAt: false, updatedAt: false }
    );

    return TreasIDs;
};
