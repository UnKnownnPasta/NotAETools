const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class FarmIDs extends Model {
        // Accepts { name: String, uid: String, etc } type data
        static async bulkUpdateFarmInfo(userinfo) {
            // Extract unique UID values from userinfo
            const uniqueUIDs = [...new Set(userinfo.map((res) => res.uid))];
        
            // Use transaction to ensure atomicity of the updates
            await this.sequelize.transaction(async (t) => {
                // Iterate over unique UID values
                for (const uid of uniqueUIDs) {
                    const userToUpdate = userinfo.find((res) => res.uid === uid);
        
                    // Use update with where clause for efficient updates
                    await this.update(
                        {
                            name: userToUpdate.name,
                            ttltokens: userToUpdate.ttltokens,
                            bonus: userToUpdate.bonus,
                            spent: userToUpdate.spent,
                            left: userToUpdate.left,
                            playtime: userToUpdate.playtime,
                        },
                        { where: { uid }, transaction: t }
                    );
                }
            });
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
