const FissureManager = require('./fissures')
const SheetHandler = require('./googleHandle')

class IntervalManager {
    constructor() {
        this.intervals = []
        this.client = null
    }

    setClient(client) { this.client = client; }

    async startIntervals() {
        if (!this.client) return;
        const fissureInterval = setInterval(async () => {
            await FissureManager.syncFissures();
        }, 180_000);
        
        const sheetInterval = setInterval(async () => {
            await SheetHandler.startAsync();
        }, 300_000);
        
        this.intervals.push(fissureInterval, sheetInterval, boxInterval);
    }

    stopIntervals() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
    }
}

module.exports = new IntervalManager()
