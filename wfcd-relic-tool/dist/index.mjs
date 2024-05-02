var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/Generator.ts
import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";

// src/Config.ts
var Config = {
  warframeRelicDropUrl: "https://drops.warframestat.us/data/relics.json",
  warframeMarketItemUrl: "https://api.warframe.market/v1/items",
  warframeItemsUrl: "https://api.warframestat.us/items/search/Relics?by=category",
  warframeRelicDropInfoUrl: "https://drops.warframestat.us/data/info.json",
  warframePatchlogsUrl: "https://raw.githubusercontent.com/WFCD/warframe-patchlogs/master/data/patchlogs.json"
};
var Config_default = Config;

// src/Logger.ts
import * as console from "console";
var fromString = /* @__PURE__ */ __name((logLevelIsh) => {
  switch (logLevelIsh == null ? void 0 : logLevelIsh.toLowerCase()) {
    case "fatal":
      return -1 /* FATAL */;
    case "error":
    case "bad":
      return 0 /* ERROR */;
    case "info":
    case "log":
      return 1 /* LOG */;
    case "debug":
      return 2 /* DEBUG */;
    default:
      return -1 /* FATAL */;
  }
}, "fromString");
var _Logger = class _Logger {
  logLevel = fromString(process.env.LOG_LEVEL || "fatal");
  log(message) {
    if (this.logLevel >= 1 /* LOG */)
      console.log(message);
  }
  error(message) {
    if (this.logLevel >= 0 /* ERROR */)
      console.error(message);
  }
  debug(message) {
    if (this.logLevel === 2 /* DEBUG */)
      console.debug(message);
  }
  fatal(message) {
    if (this.logLevel >= -1 /* FATAL */) {
      console.error(`FATAL: ${message}`);
      throw new Error(message);
    }
  }
};
__name(_Logger, "Logger");
var Logger = _Logger;
var Logger_default = new Logger();

// src/Generator.ts
var _Generator = class _Generator {
  relicsRaw;
  wfcdItems;
  wfmItems;
  relics;
  constructor() {
    this.relics = [];
  }
  /**
   * Main function to fetch and generate the relic data
   * @returns {Promise<Array<TitaniaRelic>>} The Relics data array
   */
  async generate() {
    Logger_default.log("Starting Generation");
    await this.fetchRawData();
    this.filterWFCDRelics();
    this.generateTitaniaRelics();
    return this.relics;
  }
  /**
   * Fetches all required data from WFCD and WFM.
   */
  async fetchRawData() {
    var _a;
    const relicRequest = await fetch(Config_default.warframeRelicDropUrl);
    if (!relicRequest.ok) {
      Logger_default.error("Failed to fetch Warframe relics from WFCD!");
      return;
    }
    this.relicsRaw = (_a = await relicRequest.json()) == null ? void 0 : _a.relics;
    const wfmRequest = await fetch(Config_default.warframeMarketItemUrl);
    if (!wfmRequest.ok) {
      Logger_default.error("Failed to fetch items from WFM!");
      return;
    }
    this.wfmItems = await wfmRequest.json();
    const wfcdItemRequest = await fetch(Config_default.warframeItemsUrl);
    if (!wfcdItemRequest.ok) {
      Logger_default.error("Failed to fetch items from WFCD! ");
      return;
    }
    this.wfcdItems = await wfcdItemRequest.json();
  }
  /**
   * Generates the relic data
   *  uses WFCD/warframe-drop-data to check what relics exist,
   *  and adds information from WFCD/warframe-items and WFM
   */
  generateTitaniaRelics() {
    if (typeof this.relicsRaw === "undefined" || typeof this.wfmItems === "undefined") {
      Logger_default.log("Failed to load relics/item data");
      return;
    }
    const { length } = this.relicsRaw;
    for (let i = 0; i < length; i += 1) {
      const rawRelic = this.relicsRaw[i];
      Logger_default.debug(`[${i + 1}/${length}] ${rawRelic.tier} ${rawRelic.relicName}`);
      const relic = this.generateTitaniaRelic(rawRelic);
      this.relics.push(relic);
    }
    Logger_default.debug(`Finished parsing ${this.relics.length} relics`);
  }
  /**
   * Writes the fully generated data to disk.
   * @param {string} dataDir Directory to store the relic data in. Default: ../data/
   * @param {string} fileName Filename base ex: "Relics" becomes "Relics.json" and "Relics.min.json". Default: "Relics"
   * @param {boolean} generateMin True if a minified json should be generated too. Default: true
   */
  async writeData(dataDir, fileName, generateMin) {
    const DataDir = dataDir ?? path.join(__dirname, "..", "data");
    const RelicPath = fileName ? path.join(DataDir, `${fileName}.json`) : path.join(DataDir, "Relics.json");
    await fs.writeFile(RelicPath, JSON.stringify(this.relics, void 0, 4));
    if (generateMin) {
      const RelicMinPath = fileName ? path.join(DataDir, `${fileName}.min.json`) : path.join(DataDir, "Relics.min.json");
      await fs.writeFile(RelicMinPath, JSON.stringify(this.relics));
    }
  }
  /**
   * Generates a single relic from all available data
   * @param {WFCDRelic} rawRelic relic to pull Titania data from
   * @returns {TitaniaRelicReward}
   */
  generateTitaniaRelic(rawRelic) {
    var _a, _b;
    const name = `${rawRelic.tier} ${rawRelic.relicName}`;
    const rewards = rawRelic.rewards.map((rawReward) => {
      var _a2, _b2, _c;
      const { chance } = rawReward;
      const { rarity } = rawReward;
      const wfmInfo = (_a2 = this.wfmItems) == null ? void 0 : _a2.payload.items.find((x) => x.item_name === rawReward.itemName);
      const isSpecial = ["Forma", "Kuva", "Exilus", "Riven"].find(
        (x) => (
          // eslint-disable-next-line @typescript-eslint/comma-dangle
          rawReward.itemName.toLowerCase().includes(x.toLowerCase())
        )
      );
      if (!(wfmInfo || isSpecial)) {
        Logger_default.debug(`Failed to find wfm item for ${rawReward.itemName}`);
      }
      const item = {
        name: rawReward.itemName,
        uniqueName: ((_c = (_b2 = this.wfcdItems) == null ? void 0 : _b2.find((x) => x.name.toLowerCase() === `${name.trim()} Intact`.toLowerCase())) == null ? void 0 : _c.uniqueName) || "",
        warframeMarket: void 0
      };
      if (wfmInfo) {
        item.warframeMarket = { id: wfmInfo.id, urlName: wfmInfo.url_name };
      }
      return { rarity, chance, item };
    });
    let drops = [];
    const wfcdItem = (_a = this.wfcdItems) == null ? void 0 : _a.find((x) => x.name.toLowerCase() === `${name.trim()} Intact`.toLowerCase());
    if (!wfcdItem) {
      Logger_default.error(`Failed to get WFCD item for relic: ${name}`);
    }
    if (wfcdItem && wfcdItem.drops) {
      drops = wfcdItem.drops.map((rawDrop) => {
        return { rarity: rawDrop.rarity, chance: rawDrop.chance, location: rawDrop.location };
      });
    }
    const wfm = (_b = this.wfmItems) == null ? void 0 : _b.payload.items.find((x) => x.item_name === `${name.trim()} Relic`);
    if (!wfm) {
      Logger_default.error(`Failed to get relic item from wfm: ${name}`);
    }
    return {
      name,
      rewards,
      locations: drops,
      uniqueName: (wfcdItem == null ? void 0 : wfcdItem.uniqueName) || "",
      vaultInfo: { vaulted: drops.length === 0 },
      ...(wfm == null ? void 0 : wfm.id) && (wfm == null ? void 0 : wfm.url_name) && { warframeMarket: { id: wfm == null ? void 0 : wfm.id, urlName: wfm == null ? void 0 : wfm.url_name } }
    };
  }
  /**
   * Filters WFCD's relic data to only include Intact variants, since we just need the base.
   */
  filterWFCDRelics() {
    var _a, _b, _c;
    const before = ((_a = this.relicsRaw) == null ? void 0 : _a.length) || 0;
    this.relicsRaw = (_b = this.relicsRaw) == null ? void 0 : _b.filter((x) => x.state === "Intact");
    Logger_default.log(`Filtered relics to intact variants. Before: ${before} After: ${((_c = this.relicsRaw) == null ? void 0 : _c.length) || 0}`);
  }
};
__name(_Generator, "Generator");
var Generator = _Generator;

// src/VersionManager.ts
import path2 from "path";
import fs2 from "fs/promises";
import fetch2 from "node-fetch";
var _VersionManager = class _VersionManager {
  versionPath;
  versionRawPath;
  hashPath;
  /**
   * Creates a new VersionManager instance.
   * @param {string} dataDir Folder to write version information to.
   * @constructor
   */
  constructor(dataDir) {
    const DataDir = dataDir ?? path2.join(__dirname, "..", "data");
    this.versionPath = path2.join(DataDir, "version.json");
    this.versionRawPath = path2.join(DataDir, "version.txt");
    this.hashPath = path2.join(DataDir, "hash.json");
  }
  /**
   * Checks if the current data needs an update
   */
  async updateNeeded() {
    const infoReq = await fetch2(Config_default.warframeRelicDropInfoUrl);
    if (!infoReq.ok) {
      Logger_default.fatal("Failed to fetch version info!");
    }
    const info = await infoReq.json();
    try {
      await fs2.access(this.hashPath);
      const infoFile = JSON.parse(await fs2.readFile(this.hashPath, "utf-8"));
      return infoFile.hash !== info.hash;
    } catch (ex) {
      return true;
    }
  }
  /**
   * Writes both game and drop version metadata
   * @param {number} timestamp Timestamp the build was started at
   */
  async writeVersion(timestamp) {
    const patchLogsReq = await fetch2(Config_default.warframePatchlogsUrl);
    if (!patchLogsReq.ok) {
      Logger_default.error("Failed to fetch patchlogs");
      return;
    }
    const patchlogs = await patchLogsReq.json();
    const version = patchlogs[0].name.replace(/ \+ /g, "--").replace(/[^0-9\-.]/g, "").trim();
    const hashReq = await fetch2(Config_default.warframeRelicDropInfoUrl);
    if (!hashReq.ok) {
      Logger_default.error("Failed to fetch hashInfo");
      return;
    }
    const hashInfo = await hashReq.json();
    const versionInfo = { version, title: patchlogs[0].name };
    const hashFile = { hash: hashInfo.hash, deUpdated: hashInfo.modified, timestamp };
    await fs2.writeFile(this.hashPath, JSON.stringify(hashFile, void 0, 2), "utf-8");
    await fs2.writeFile(this.versionPath, JSON.stringify(versionInfo, void 0, 2), "utf-8");
    await fs2.writeFile(this.versionRawPath, version, "utf-8");
    Logger_default.debug("Finished writing version info");
  }
};
__name(_VersionManager, "VersionManager");
var VersionManager = _VersionManager;
export {
  Generator,
  VersionManager
};
