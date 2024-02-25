const { Sequelize, DataTypes, Model } = require("sequelize");

module.exports = (sequelizeInstance) => {
    class Resources extends Model {
    }
    Resources.init(
        {
            clan: { type: DataTypes.STRING, defaultValue: "" },
            Credits: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            AlloyPlate: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Asterite: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            AucruxCapacitors: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Bracoid: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Carbides: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Circuits: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            ControlModule: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Copernics: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Cryotic: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            CubicDiodes: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            DetoniteAmpule: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Ferrite: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            FieldronSample: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Forma: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Fresnels: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Gallium: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            GallosRods: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Hexenon: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Isos: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Kesslers: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Komms: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Morphics: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            MutagenSample: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            NanoSpores: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            NeuralSensors: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Neurodes: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            NitainExtract: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Nullstones: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            OrokinCell: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Oxium: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Plastids: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            PolymerBundle: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Pustrels: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Rubedo: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Salvage: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Tellurium: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            TicorPlate: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Titanium: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Trachons: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            DetoniteInjector: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            Fieldron: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } },
            MutagenMass: { type: DataTypes.JSON, defaultValue: { "name": "", "amt": "", "short": "" } }
        },
        { sequelize: sequelizeInstance, modelName: 'Resources', createdAt: false }
    );

    return Resources;
};
