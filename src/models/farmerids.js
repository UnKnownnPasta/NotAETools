const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class FarmIDs extends Model {
        // Accepts { name: String, uid: String, etc } type data
        static async bulkUpdateFarmInfo(userinfo) {
            const uniqueUIDs = [...new Set(userinfo.map((res) => res.uid))];
        
            await this.sequelize.transaction(async (t) => {
                for (const uid of uniqueUIDs) {
                    const userToUpdate = userinfo.find((res) => res.uid === uid);
                    
                    await this.upsert(
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
