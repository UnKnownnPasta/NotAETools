const { loadFiles } = require("../../utils/generic");

class AllHandles {
    constructor() {
        this.client = null;
        this.treasury = null;
        this.farmer = null;
        this.buttons = null;
        this.commandDepartments = new Map();
    }

    setClient(client) {
        this.client = client;
    }

    async reloadTreasury() {
        if (this.client) {
            this.treasury = await loadFiles('core/departments/treasury');
            this.treasury.forEach(command => {
                this.commandDepartments.set(command.name, 'treasury')
            });
        }
    }

    async reloadFarmer() {
        if (this.client) {
            this.farmer = await loadFiles('core/departments/farmer');
            this.farmer.forEach(command => {
                this.commandDepartments.set(command.name, 'farmer')
            });
        }
    }

    async reloadButtons() {
        if (this.client) {
            this.buttons = await loadFiles('core/interactions');
            this.buttons.forEach(command => {
                this.commandDepartments.set(command.name, 'buttons')
            });
        }
    }
    getDepartment(dep) {
        const dept = this.commandDepartments.get(dep)
        if (dept) return this[dept]
        return undefined;

    }
    loadAll() {
        this.reloadButtons()
        this.reloadFarmer()
        this.reloadTreasury()
    }
}

module.exports = new AllHandles();
