const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class TreasIDs extends Model {
        // Accepts { user: String, uid: String } type data
        static async bulkUpdateIDs(userinfo) {
            // Extract unique UID values from userinfo
            const uniqueUIDs = [...new Set(userinfo.map((res) => res.uid))];
        
            // Use transaction to ensure atomicity of the updates
            await this.sequelize.transaction(async (t) => {
                // Iterate over unique UID values
                for (const uid of uniqueUIDs) {
                    const userToUpdate = userinfo.find((res) => res.uid === uid);
        
                    // Use update with where clause for efficient updates
                    await this.update({ user: userToUpdate.user }, { where: { uid }, transaction: t });
                }
            });
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
