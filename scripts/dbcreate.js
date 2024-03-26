const { google } = require('googleapis')
const { spreadsheet, dualitemslist, collectionBox } = require('../data/config.json')
const fs = require('node:fs/promises');
const { warn, titleCase } = require('./utility');
const path = require('node:path');
const { Client, ThreadChannel } = require('discord.js');

// Google fetch func
const googleFetch = async (id, range) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: id,
        range: range,
    });
}

async function loadAllRelics() {
    const sheetValues = await googleFetch(spreadsheet.treasury.id, spreadsheet.treasury.relicName + spreadsheet.treasury.ranges.relic)
    if (!sheetValues || !sheetValues?.data) return warn('RLCERR', 'Error when refreshing relic data', `No data found for treasury relics`);

    const range = (num) => {
        return num >= 0 && num <= 7 ? 'ED'
               : num > 7 && num <= 15 ? 'RED'
               : num > 15 && num <=31 ? 'ORANGE'
               : num > 31 && num <=64 ? 'YELLOW'
               : 'GREEN'
    }

    const values = sheetValues.data.values;
    if (values.some(x => x[0][0] == '#ERROR!' || x[0][1] == '#ERROR!')) return warn('RLCERR', 'Error when refreshing relic data', `No data found for treasury relics`);

    const pnRegex = /(.+?)\[/,
        pcRegex = /\[(.+?)\]/;

    // list is like [ [{}, {}], [{}, {}], ... ]
    if (values && values.length) {
        const combinedData = values.map((row, rowIndex) => {
            return row
            .slice(0, 7)
            .map((rw, rwi) => {
                let partName, partCount, partRarity;
                const brckt = rw.match(pcRegex)
                if (rwi == 0) {
                    return { name: row[0], tokens: row[7], has: row.slice(1, 7).map(r => {
                        let temp = r.slice(0, r.indexOf('[')-1)
                        if (dualitemslist.includes(temp)) temp += ' x2'
                        return temp
                    }) }
                }
                if (brckt) {
                    partName = rw.match(pnRegex)[1].trim()
                    if (dualitemslist.includes(partName)) partName += ' x2'
                    partCount = rw.match(pcRegex)[1]
                    partRarity = range(parseInt(partCount))
                } else {
                    partName = rw; partCount = ""; partRarity = "";
                }
                return { name: partName, count: partCount, type: partRarity }
            });
        });
        const rNames = combinedData.map(relic => relic[0].name)
        const pNames = [... new Set(combinedData.map(relic => relic[0].has).flat().map(relic => relic.replace(' x2', '')))]

        await fs.writeFile(path.join(__dirname, '..', 'data/relicdata.json'), JSON.stringify({ relicData: combinedData, relicNames: rNames, partNames: pNames }))
    }
}


async function getAllClanData() {
    // User IDs
    const TreasIDValues = await googleFetch(spreadsheet.treasury.id, spreadsheet.treasury.useridName + spreadsheet.treasury.ranges.ids);
    const TreasIDs = TreasIDValues.data.values.filter(x => x.length !== 0).map(user => { return { id: user[0], name: user[1] } })
    if (!TreasIDs || !TreasIDs?.length)
        return warn('CLNERR', 'Error when fetching clan data', `No data found when searching for treasury user ids (${spreadsheet.treasury.useridName})`);

    const FarmIDValues = await googleFetch(spreadsheet.farmer.id, spreadsheet.farmer.userName + spreadsheet.farmer.ranges.users);
    const FarmIDs = FarmIDValues.data.values.filter(x => x.length !== 0).map(user => {
        return { id: user[0], name: user[1], ttltokens: user[2], bonus: user[3], spent: user[4], left: user[5], playtime: user[6] }
    })
    if (!FarmIDs || !FarmIDs?.length) 
        return warn('CLNERR', 'Error when fetching clan data', `No data found when searching for farmer user ids (${spreadsheet.farmer.userName})`);

    // Clan Resources
    const ClanResources = [];

    const promises = Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
        const clandata = await googleFetch(spreadsheet.farmer.id, spreadsheet.farmer.resourceName + key[1]);
        if (!clandata) return {}

        let localist = [];
        clandata.data.values.forEach(x => localist.push({ name: x[0], amt: x[1], short: x[2] ?? '0' }));
        return { clan: key[0], resources: localist };
    });
    
    await Promise.all(promises)
        .then(async (results) => {
            if (!results || !results?.length || results.some(x => !Object.keys(x).length))
                return warn('CLNERR', 'Error when fetching clan data', `No data found when searching for clan resources (${spreadsheet.farmer.resourceName})`);
            ClanResources.push(...results);
            await fs.writeFile(path.join(__dirname, '..', 'data/clandata.json'), JSON.stringify({ treasuryids: TreasIDs, farmerids: FarmIDs, resources: ClanResources }))            
        })
        .catch(error => {
            console.error('Error fetching sheet values:', error.message);
        });
}

/**
 * @param {Client} client 
 */
async function getAllBoxData(client) {
    const boxChannel =  await client.channels.cache.get(collectionBox.testid).threads;
    const boxStock = {}

    const matchAny = (a, b) => a.startsWith(b) || b.startsWith(a)
    
    const promises = Object.entries(collectionBox.testchannels).map(async ([chnl, cid]) => {

        await boxChannel.fetch(cid).then(/*** @param {ThreadChannel} thread */ async (thread) => {

            await thread.messages.fetch({ limit: thread.messageCount, cache: false }).then((messages) => { messages.map(async (msg) => {

                let parts = msg.content
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/\s*prime\s*/, ' ')
                    .replace(/\b(\d+)\s*x?\s*\b/g, '$1x ')
                    .replace(/\b(\d+)\s*x?\b\s*(.*?)\s*/g, '$1x $2, ')
                    .split(/(?:(?:, )|(?:\n)|(?:\s(?=\b\d+x?\b)))/);


                let newParts = [];
                for (let i = 0; i < parts.length; i++) {
                    if (/\d+x/.test(parts[i]) && i < parts.length - 1) {
                        newParts.push(parts[i] + parts[i + 1]);
                        i++;
                    } else if (i < parts.length - 1 && parts[i + 1].endsWith('x ')) {
                        newParts.push(parts[i + 1] + parts[i]);
                        i++;
                    } else {
                        newParts.push(parts[i]);
                    }
                }

                parts = newParts.filter(x => /\dx/.test(x) && !/[^\w\s]/.test(x));

                if (!parts.length) return;
                const splitByStock = parts
                    .filter(x => x)
                    .map(part => part
                        .split(/(\b\d+\s*x\b|\bx\s*\d+\b)\s*(.*)/)
                        .map(x => {
                    let y = x
                    if (/\d/.test(x)) {
                        y = parseInt(x.replace(/(\d+)x/, '$1'))
                        if (isNaN(y)) y = x.replace(/(\d+)x/, '$1');
                    }
                    return y;
                }));

                await splitByStock.map((part) => {
                    part = part.filter(x => x)
                    let nmIndex = part.indexOf(part.find(element => typeof element === 'number'));

                    if (nmIndex == -1 || part.length < 2 || !part.some(x => typeof x == 'string')) { return; }

                    let updatedAny = false;
                    const boxObj = Object.entries(boxStock);
                    let curPartName = part[~nmIndex & 1].trim()

                    for (const [key, val] of boxObj) {
                        let words = key.split(" ")
                        let x = words[0], y = words.at(-1);
                        let partText = curPartName.split(' ').filter(x => x)

                        if (partText.slice(0, -1).some(n => matchAny(n, x))) {
                            if (partText[0] == 'magnus' && ['bp', 'receiver', 'reciever', 'barrel'].some(nx => nx.startsWith(partText.at(-1)))) {
                                updatedAny = true
                                boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                return;
                            }
                            else if (partText[0] == 'mag' && ['bp', 'neuroptics', 'blueprint', 'systems', 'chassis'].some(nx => nx.startsWith(partText.at(-1)))) {
                                updatedAny = true
                                boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                return;
                            }
                            else if (matchAny(y, partText.at(-1))) {
                                updatedAny = true
                                boxStock[key] += part[nmIndex]
                                return;
                            }
                        }
                    }

                    if (!updatedAny) { boxStock[curPartName] = part[nmIndex] }
                })
            })
        })
        })
    })

    await Promise.all(promises);

    const fixedBoxStock = {}
    const jsfile = await JSON.parse( await fs.readFile(path.join(__dirname, '..', 'data/relicdata.json')) )
    const partNames = [... new Set(jsfile.relicData.map(x => x[0].has).flat())]

    const fixpromises = Object.entries(boxStock).map(async ([part, stock]) => {
        const splitnm = titleCase(part).split(" ")
        let pind = partNames.filter(x => {
            if (splitnm[0] == 'Mag') return x.startsWith('Mag')
            else if (splitnm[0] == 'Magnus') return x.startsWith('Magnus')
            else return x.startsWith(splitnm[0])
        })
        .filter(y => y.split(' ').slice(1).some(
            z => splitnm.slice(1).some(p => z.startsWith(p == 'bp' ? 'BP' : p.slice(0, -1)))))
            
        if (pind.length > 1) {
            let numMatch = 0;
            pind.map(x => {
                x.split(' ').some(y => splitnm.includes(y) ? numMatch++ : false)
                if (numMatch == splitnm.length) {
                    pind = [ x ]
                    return;
                }
            })
        }

        if (!pind.length) return console.log(part, pind);
        fixedBoxStock[pind.join(" ")] = stock
    })

    await Promise.all(fixpromises);
    await fs.writeFile(path.join(__dirname, '..', 'data/boxdata.json'), JSON.stringify(fixedBoxStock))
}

module.exports = { loadAllRelics, getAllClanData, getAllBoxData }