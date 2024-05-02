interface WarframeMarketRoot {
    payload: {
        items: Array<WarframeMarketItem>;
    };
}
interface WarframeMarketItem {
    /**
     * WFM Item ID
     */
    id: string;
    /**
     * Url name for querying WFM
     */
    url_name: string;
    /**
     * Thumbnail URL relative to wfm api base
     */
    thumb: string;
    /**
     * Item Name
     */
    item_name: string;
}
interface WFCDRelic {
    /**
     * Relic Tier (Axi, Neo, etc.)
     */
    tier: string;
    /**
     * Relic Name (A1, A10, etc.)
     */
    relicName: string;
    /**
     * Relic Refinement state
     */
    state: 'Intact' | 'Exceptional' | 'Flawless' | 'Radiant';
    /**
     * Relic Rewards
     */
    rewards: Array<WFCDRelicReward>;
    /**
     * Internal WFCD id
     */
    _id: string;
}
interface WFCDRelicReward {
    /**
     * Dropped Item name
     */
    itemName: string;
    /**
     * Dropchance Rarity (Uncommon/Rare ?)
     */
    rarity: 'Uncommon' | 'Rare';
    /**
     * Actual Dropchance in %
     */
    chance: number;
    /**
     * Internal ID
     */
    _id: string;
}
interface WFCDItem {
    /**
     * Item Name
     */
    name: string;
    /** Unique identifying name */
    uniqueName: string;
    /**
     * Item Drop Location
     */
    drops?: Array<WFCDItemDropLocation>;
}
interface WFCDItemDropLocation {
    /**
     * Dropchance in %
     */
    chance: number;
    /**
     * Mission location
     */
    location: string;
    /**
     * Drop rarity
     */
    rarity: string;
    /**
     * Relic Type
     */
    type: string;
}
interface TitaniaRelic {
    /**
     * Relic Combined Name (Ex: Axi A1)
     */
    name: string;
    /**
     * Relic Rewards when opened
     */
    rewards: Array<TitaniaRelicReward>;
    /**
     * Drop Locations for the relics
     */
    locations: Array<TitaniaRelicLocation>;
    /**
     * Warframe Market Information
     *  undefined for untradable
     */
    warframeMarket?: TitaniaWFMInfo;
    /**
     * Relic Vault Information
     */
    vaultInfo: TitaniaRelicVaultedInfo;
    /** unique name for corresponding warframe-items Item */
    uniqueName: string;
}
interface TitaniaRelicReward {
    /**
     * Relic Rarity (Uncommon,Rare ?)
     */
    rarity: 'Uncommon' | 'Rare';
    /**
     * Reward Drop Chance in %
     */
    chance: number;
    /**
     * Item Information
     */
    item: TitaniaRelicRewardItem;
}
interface TitaniaRelicRewardItem {
    /**
     * Item Name
     */
    name: string;
    /** unique name for corresponding warframe-items Item */
    uniqueName: string;
    /**
     * WarframeMarket Info
     */
    warframeMarket?: TitaniaWFMInfo;
}
type Rarity = 'Uncommon' | 'Rare' | 'Legendary' | 'Common';
interface TitaniaRelicLocation {
    /** Location Info $planet-$node (Ex: Eris - Phalan) */
    location: string;
    /**
     * Rarity (Uncommon, Rare ?)
     */
    rarity: Rarity;
    /**
     * Dropchance in %
     */
    chance: number;
}
interface TitaniaWFMInfo {
    /**
     * Warframe Market ID
     */
    id: string;
    /**
     * Warframe market URL parameter
     */
    urlName: string;
}
interface TitaniaRelicVaultedInfo {
    /**
     * If the relic is vaulted
     */
    vaulted: boolean;
}

declare class Generator {
    relicsRaw: Array<WFCDRelic> | undefined;
    wfcdItems: Array<WFCDItem> | undefined;
    wfmItems: WarframeMarketRoot | undefined;
    relics: Array<TitaniaRelic>;
    constructor();
    /**
     * Main function to fetch and generate the relic data
     * @returns {Promise<Array<TitaniaRelic>>} The Relics data array
     */
    generate(): Promise<Array<TitaniaRelic>>;
    /**
     * Fetches all required data from WFCD and WFM.
     */
    fetchRawData(): Promise<void>;
    /**
     * Generates the relic data
     *  uses WFCD/warframe-drop-data to check what relics exist,
     *  and adds information from WFCD/warframe-items and WFM
     */
    generateTitaniaRelics(): void;
    /**
     * Writes the fully generated data to disk.
     * @param {string} dataDir Directory to store the relic data in. Default: ../data/
     * @param {string} fileName Filename base ex: "Relics" becomes "Relics.json" and "Relics.min.json". Default: "Relics"
     * @param {boolean} generateMin True if a minified json should be generated too. Default: true
     */
    writeData(dataDir?: string, fileName?: string, generateMin?: boolean): Promise<void>;
    /**
     * Generates a single relic from all available data
     * @param {WFCDRelic} rawRelic relic to pull Titania data from
     * @returns {TitaniaRelicReward}
     */
    private generateTitaniaRelic;
    /**
     * Filters WFCD's relic data to only include Intact variants, since we just need the base.
     */
    private filterWFCDRelics;
}

declare class VersionManager {
    versionPath: string;
    versionRawPath: string;
    hashPath: string;
    /**
     * Creates a new VersionManager instance.
     * @param {string} dataDir Folder to write version information to.
     * @constructor
     */
    constructor(dataDir?: string);
    /**
     * Checks if the current data needs an update
     */
    updateNeeded(): Promise<boolean>;
    /**
     * Writes both game and drop version metadata
     * @param {number} timestamp Timestamp the build was started at
     */
    writeVersion(timestamp: number): Promise<void>;
}

export { Generator, type Rarity, type TitaniaRelic, type TitaniaRelicLocation, type TitaniaRelicReward, type TitaniaRelicRewardItem, type TitaniaRelicVaultedInfo, type TitaniaWFMInfo, VersionManager, type WFCDItem, type WFCDItemDropLocation, type WFCDRelic, type WFCDRelicReward, type WarframeMarketItem, type WarframeMarketRoot };
