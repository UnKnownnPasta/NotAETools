import { MongoClient } from "mongodb";

async function connectToCluster() {
    const uri = process.env.MONGODB_URI;

    try {
        const client = new MongoClient(uri);
        console.log("mongo | Connecting to MongoDB Atlas cluster...");
        await client.connect();
        console.log("mongo | Successfully connected to MongoDB Atlas!");

        return client;
    } catch (error) {
        console.error("mongo | Connection to MongoDB Atlas failed!", error);
        process.exit();
    }
}

export default new class DB {
    constructor() {
        this._connected = false;
        this._mongoClient = null;
    }

    async connect() {
        if (this._connected) return;
        this._mongoClient = await connectToCluster();
        if (this._mongoClient) this._connected = true;
    }

    /** * @returns {MongoClient} */
    get mongoClient() {
        if (!this._mongoClient) {
            console.error('mongo | No client connected');
            return null;
        }
        return this._mongoClient;
    }
}();
