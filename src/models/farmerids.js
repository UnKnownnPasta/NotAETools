const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class FarmIDs extends Model {
        // Accepts { name: String, uid: String, etc } type data
        static async bulkUpdateFarmInfo(userinfo) {
            const uniqueUIDs = [...new Set(userinfo.map((res) => res.uid))];
        
            await this.sequelize.transaction(async (t) => {
                const bulkUpsertData = userinfo
                    .filter((user) => uniqueUIDs.includes(user.uid))
                    .map((user) => ({
                        uid: user.uid,
                        name: user.name,
                        ttltokens: user.ttltokens,
                        bonus: user.bonus,
                        spent: user.spent,
                        left: user.left,
                        playtime: user.playtime,
                    }));
            
                await this.bulkCreate(bulkUpsertData, {
                    updateOnDuplicate: ['name', 'ttltokens', 'bonus', 'spent', 'left', 'playtime'],
                    transaction: t,
                });
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
