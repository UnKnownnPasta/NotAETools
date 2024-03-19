const { Sequelize, DataTypes } = require('sequelize');
const path = require('node:path')
const fsp = require('node:fs/promises')

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: path.join(process.cwd(), 'data/database.sqlite'),
});

const Runs = sequelize.define('Runs', {
	UID: {
		type: DataTypes.STRING,
		unique: true,
	},
	run_count: DataTypes.INTEGER,
	username: DataTypes.STRING,
});

async function updateRuns(createBoolean) {
    const treasList = (await JSON.parse(await fsp.readFile('./data/clandata.json'))).treasuryids;
    const objectified = treasList.map(({ id, name }) => { return { UID: id, run_count: 0, username: name }; })
    try {
        if (createBoolean) {
            await Runs.bulkCreate(createBoolean);
        } else {
            await Runs.upsert(createBoolean)
        }
    } catch (error) {
        console.error(error)
    }
}

module.exports = { sequelize, Runs, updateRuns };