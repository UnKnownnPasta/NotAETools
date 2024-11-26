import { google } from 'googleapis';
import { spreadsheet, dualitemslist } from '../other/config.json';

import logger from './logger.mjs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import axios from 'axios';
import cheerio from 'cheerio';

const farmerdata = async () => {
    const readData = await fs.readFile(path.join(__dirname, '../data/farmers.json'))
    return await JSON.parse(readData)
}

const googleSheets = async ({ spreadsheetId, range }) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheetId,
        range: range,
    });
}

export async function searchForDrops(htmlText, searchString) {
    let count = 0;
    let position = 0;

    while (position !== -1) {
        position = htmlText.indexOf(searchString, position);

        if (position !== -1) {
            count++;
            position += searchString.length;
            if (count > 5) return false;
            await new Promise((resolve) => setImmediate(resolve));
        }
    }

    return true;
}


const range = (num) => 
    num >= 0 && num <= 9 ? 'ED'
    : num > 9 && num <= 15 ? 'RED'
    : num > 15 && num <= 31 ? 'ORANGE'
    : num > 31 && num <= 64 ? 'YELLOW'
    : num > 64 ? 'GREEN' : '';

const normalize = (name) => {
    name = name.replace(/\s+/g, ' ').trim().replace(" Blueprint", "");
    return name.endsWith(" Prime") ? name.replace(" Prime", " Blueprint") : name.replace(" Prime ", " ");
}

export async function fetchData(msg, ogmsg) {
    console.time("fetchData");

    const sheetValues = await googleSheets({
        spreadsheetId: spreadsheet.personal.id,
        range: "Sheet2" + "!H2:I",
    }).catch((err) => {
        logger.error(err, "Error fetching items and stock, using google client");
    });

    const sheetValues2 = await googleSheets({
        spreadsheetId: spreadsheet.personal.id,
        range: "Sheet2" + "!A2:C",
    }).catch((err) => {
        logger.error(err, "Error fetching items and stock, using google client");
    });

    const tokenValues = {};
    const values = sheetValues.data.values;
    for (let i = 0; i < values.length; i++) {
        tokenValues[values[i][0]] = parseInt(values[i][1]) || 0;
    }

    const stockValues = {};
    const values2 = sheetValues2.data.values;
    for (let i = 0; i < values2.length; i++) {
        let itemName = normalize(`${values2[i][0] + " " + values2[i][1]}`.replace(" and ", " & ").replace("2X ", "").replace(" Prime Collar", " Prime"));
        const stck = parseInt(values2[i][2]) || 0;
        stockValues[itemName] = dualitemslist.includes(itemName) ? stck / 2 | 0 : stck;
    }

    if (msg) {
        await msg.edit({ content: `\`\`\`[1.5/2] Fetching data...\`\`\`` });
    }

    stockValues["Venka Blades"] = stockValues["Venka Blade"] || 0;
    delete stockValues["Venka Blade"];

    try {
        const url = "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";
        const response = await axios.get(url);

        const htmlText = response.data;
        const extractedHtml = htmlText.match(/<h3 id="relicRewards">.*?<h3 id="keyRewards">/s)?.[0] || "";
        const $ = cheerio.load(extractedHtml);
        const tables = $("table tbody > tr")

        if (msg) {
            await msg.edit({ content: `\`\`\`[2/2] Fetching data...\`\`\`` });
        }

        const relicRewards = await processTables($, tables, msg);
        const allRelicData = await processRelics(relicRewards, stockValues, tokenValues, htmlText, msg);

        await fs.writeFile(path.join(__dirname, '..', 'data', 'RelicData.json'), JSON.stringify(allRelicData))

        if (msg) {
            await msg.edit({ content: `\`\`\`DONE Fetching data...\nDONE Creating Records...\nDONE Updating DB... ✅\`\`\`` });
            ogmsg.react('✔');
        }

        setTimeout(async () => {
            if (msg) {
                await msg.delete();
            }
        }, 4_000);

    } catch (error) {
        console.error("Error fetching relic rewards:", error);
        if (msg) {
            await msg.edit({ content: `Couldn't update database. Error: ${error.message}` });
            ogmsg.react('❌');
        }
        return [];
    } finally {
        console.timeEnd("fetchData");
    }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function processTables($, data, msg) {
    const relicRewards = [];
    let currentRelic = { rewards: [] };

    await data.each(async (_, row) => {
        const columns = $(row).find("td");
        const textName = $(row).find("th").text().trim();

        if ($(row).hasClass("blank-row")) {
            if (currentRelic.rewards.length > 0) {
                relicRewards.push(currentRelic);
                currentRelic = { rewards: [] };
            }
            await delay(200);
            return;
        }

        if (!currentRelic.name && textName) {
            currentRelic.name = textName;
        }
        if (columns.length >= 2) {
            const reward = {
                name: columns.eq(0).text().trim().replace(" and ", " & ").replace("Kubrow Collar Blueprint", "Blueprint"),
                value: parseFloat(columns.eq(1).text().trim().match(/\((\d+(\.\d+)?)%\)/)?.[1]),
            };
            currentRelic.rewards.push(reward);
        }
        await delay(50);
    });

    if (currentRelic.rewards.length > 0) {
        relicRewards.push(currentRelic);
    }

    if (msg) {
        await msg.edit({ content: `\`\`\`DONE Fetching data...\nCreating Records...\`\`\`` });
    }

    return relicRewards;
}

async function processRelics(relicRewards, stockValues, tokenValues, htmlText, msg) {
    const newRelicRewards = [];
    const allRelicNames = [];
    const allPartNames = [];
    const orderToSortBy = [25.33, 11, 2];

    for (const relic of relicRewards) {
        const trueName = relic.name.split(" ").slice(0, -2).join(" ");
        if (trueName.includes("Requiem")) continue;
    
        const trueType = relic.name.split(" ").slice(-1)[0];
        allRelicNames.push(trueName);

        if (trueType !== "(Intact)") {
            continue;
        } else {
            const newRewards = [];

            for (const reward of relic.rewards) {
                let rewardName = normalize(reward.name.replace(/\s+/g, " ").replace(" and ", " & ").replace("2X ", ""));
                rewardName = rewardName.endsWith(" Prime") ? rewardName.replace(" Prime", " Blueprint") : rewardName;
                const stock = stockValues[rewardName];

                if (!rewardName.includes("Forma")) 
                    allPartNames.push(rewardName);

                newRewards.push({
                    item: `${rewardName}${dualitemslist.includes(rewardName) ? " x2" : ""}`,
                    stock: stock || (rewardName.includes("Forma") ? null : 0),
                    color: range(parseInt(stock) || 0),
                    rarity: parseFloat(reward.value),
                })
            };

            newRelicRewards.push({
                name: trueName,
                rewards: newRewards.sort((a, b) => orderToSortBy.indexOf(a.rarity) - orderToSortBy.indexOf(b.rarity)),
                tokens: tokenValues[trueName],
                vaulted: await searchForDrops(htmlText, trueName),
                parts: newRewards.map((reward) => reward.item.replace(" x2", "")),
            });
        }
    }

    if (msg) {
        await msg.edit({ content: `\`\`\`DONE Fetching data...\nDONE Creating Records...\nUpdating DB...\`\`\`` });
    }

    return { relicData: newRelicRewards, relicNames: [... new Set(allRelicNames)], partNames: [... new Set(allPartNames)] };
}


export async function getAllUserData(key=null) {
    if (!key) return [];

    if (key === 'treasury') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.personal.id,
            range: spreadsheet.personal.ranges.treasury,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { name: data[0], uid: data[1]?.replace("ID: ", "") ?? "0" }
        })
        return workOnData;
    } else if (key === 'farmer') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.personal.id,
            range: spreadsheet.personal.ranges.farmer,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1], tokens: data[2], bonus: data[3], spent: data[4], left: data[5], playtime: data[6] }
        })
        if (!workOnData?.length) return await farmerdata();
        return workOnData;
    } else if (key === 'leaderboard') {
        return await googleSheets({
            spreadsheetId: '1Mrp2qcFY9CO8V-MndnYCkkVBJ-f_U_zeK-oq3Ncashk',
            range: 'Leaderboard!D30:I'
        }).then((re) => {
            return re.data.values.map((data) => {
                if (data.filter(x => !x).length > 1) return;
                const run = isNaN(parseInt(data[4])) ? 0 : parseInt(data[4])
                const rad = isNaN(parseInt(data[3])) ? 0 : parseInt(data[3])
                const merch = isNaN(parseInt(data[2])) ? 0 : parseInt(data[2])
                const userid = data[1].replace('ID: ', '')
                return { uid: userid === '' ? '000000' : userid, name: !data[0] ? '#NF!' : data[0], all: run + rad + merch, run, rad, merch }
            }).filter(x => x)
        })
    } else {
        return undefined;
    }
}

export async function getAllClanData(clan=undefined) {
    if (!clan) {
        return await Promise.all(Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
            const clandata = await googleSheets({
                spreadsheetId: spreadsheet.farmer.id,
                range: spreadsheet.farmer.resourceName + key[1]
            })
            if (!clandata) return {}
    
            let localist = {};
            await Promise.all(clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' }))
            return { clan: key[0], resource: localist };
        }))
        .then(async (results) => {
            return results.filter(res => res);
        })
        .catch(error => {
            logger.error(error, 'Error fetching sheet values for clans');
        });
    } else {
        const clandata = await googleSheets({
            spreadsheetId: spreadsheet.farmer.id,
            range: spreadsheet.farmer.resourceName + spreadsheet.farmer.ranges.resource[clan]
        })
        if (!clandata) return {}

        let localist = {};
         clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' })
        return { clan: clan, resource: localist };
    }
}
