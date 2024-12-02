import mongoose from 'mongoose';


export const VCModel = new mongoose.Schema({
    superid: String,
    lastVCConnectTimestamp: Number,
    totalVCConnects: { type: Number, default: 0 },
    totalVCTime: { type: Number, default: 0 }
}, {
    collection: 'VoiceStateData'
});

async function run_mongo() {
	await mongoose.connect(`${process.env.MONGODB_URI}`);
	logger.info("[MONGOOSE] Successfully connected to MongoDB!");
}

export async function start_db() {
    await run_mongo().catch(err => logger.error(err, '[MONGOOSE] Failed to connect to MongoDB.'));
}