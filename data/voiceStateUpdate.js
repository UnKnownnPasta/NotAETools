const { VoiceState, Client } = require("discord.js");
const { default: mongoose } = require("mongoose");
const vcmodel = require('./vcmodel');

module.exports = {
    name: 'voiceStateUpdate',
    once: true,
    /**
     * Voice states listener (joining, muting, etc)
     * @param {Client} client 
     * @param {VoiceState} oldState 
     * @param {VoiceState} newState 
     */
    async listen(client, oldState, newState) {
        const VcData = mongoose.model("VoiceStateData", vcmodel);

        if (oldState.member.id === newState.member.id) {
            const superid = `${oldState.guild.id}-${oldState.member.id}`;
        
            // Check if the document exists in MongoDB
            let vcData = await VcData.findOne({ superid });
        
            // If no data exists, insert a new document
            if (!vcData) {
                if (!oldState.channelId) {
                    vcData = new VcData({
                        superid,
                        lastVCConnectTimestamp: new Date().getTime()
                    });
                } else {
                    vcData = new VcData({ superid });
                }
                await vcData.save();
            }
        
            // User joined a voice channel
            if (vcData && !oldState.channelId && newState.channelId) {
                vcData.totalVCConnects += 1;
                vcData.lastVCConnectTimestamp = new Date().getTime();
                await vcData.save();
            // User left a voice channel
            } else if (vcData && oldState.channelId && !newState.channelId) {
                const currentTime = new Date().getTime();
                const lastVCConnectTimestamp = vcData.lastVCConnectTimestamp;
                const difference = (currentTime - lastVCConnectTimestamp) / 1000;

                if (!isNaN(difference)) {
                    vcData.totalVCTime += difference;
                    vcData.lastVCConnectTimestamp = 0;
                    await vcData.save();
                }
            }
        }
    }
}