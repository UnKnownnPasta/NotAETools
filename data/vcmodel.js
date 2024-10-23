const { default: mongoose } = require("mongoose");

module.exports = new mongoose.Schema({
    superid: String,
    lastVCConnectTimestamp: Number,
    totalVCConnects: { type: Number, default: 0 },
    totalVCTime: { type: Number, default: 0 }
}, {
    collection: 'VoiceStateData'
});