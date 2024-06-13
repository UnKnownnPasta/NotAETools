const { google } = require('googleapis');
const { spreadsheet, collectionBox, dualitemslist } = require('../data/config.json');
const { titleCase } = require('./utility');
const { Client, ThreadChannel, Message } = require('discord.js');

const logger = require('./logger');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const googleSheets = async ({ spreadsheetId, range }) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheetId,
        range: range,
    });
}

const range = (num) => 
    num >= 0 && num <= 7 ? 'ED'
    : num > 7 && num <= 15 ? 'RED'
    : num > 15 && num <= 31 ? 'ORANGE'
    : num > 31 && num <= 64 ? 'YELLOW'
    : num > 64 ? 'GREEN' : '';

async function getAllRelics() {
    const sheetValues = await googleSheets({ 
        spreadsheetId: spreadsheet.treasury.id,
        range: spreadsheet.treasury.relicName + spreadsheet.treasury.ranges.relic,
    })
    .catch((err) => {
        logger.error(err, 'Error fetching items and stock, using google client')
    })

    const values = sheetValues.data.values;
    if (values.some(x => x[0] == '#ERROR!')) return logger.warn(`Error fetching items: Items have invalid values (#ERROR!)`);

    const itemStockRegex = /\[(.+?)\]/;
    const itemNameRegex = /(.*?)(?:\s+\[)/

    if (values && values?.length) {
        const allRelicData = []
        await Promise.all(values.map(async (record) => {
            const pushObj = { name: record[0], parts: [], rewards: [], tokens: record[7] }
            await Promise.all(record.slice(1, 7).map((item) => {
                let itemStock = item.match(itemStockRegex)?.[1]
                let itemName = item.match(itemNameRegex)?.[1]?.replace(' and ', ' & ')
                if (dualitemslist.includes(itemName)) itemName += " x2"
                
                pushObj.parts.push(itemName);
                pushObj.rewards.push({ item: itemName ?? "Forma", stock: itemStock ?? "", color: range(parseInt(itemStock ?? 100)) });
                return;
            }))
            allRelicData.push(pushObj)
        }));

        const [onlyRelics, onlyParts] = await Promise.all([
            [... new Set(allRelicData.map(relic => relic.name).flat())],
            [... new Set(allRelicData.map(relic => relic.parts).flat().map(part => part?.replace(" x2", "")))],
        ])
        const JSONData = { relicData: allRelicData, relicNames: onlyRelics, partNames: onlyParts.filter(p => p) }
        
        await fs.writeFile(path.join(__dirname, '..', 'data', 'RelicData.json'), JSON.stringify(JSONData))
    }
}

async function getAllUserData(key=null) {
    if (!key) return [];

    if (key === 'treasury') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.treasury.id,
            range: spreadsheet.treasury.useridName + spreadsheet.treasury.ranges.ids,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1] }
        })
        return workOnData;
    } else if (key === 'farmer') {
        return [
            {
                "uid": "305060460481216512",
                "name": "_Inexcusable",
                "tokens": "28",
                "bonus": "0",
                "spent": "0",
                "left": "28",
                "playtime": "563 (0)"
            },
            {
                "uid": "678509140708163595",
                "name": "--K--AKAI",
                "tokens": "869",
                "bonus": "755",
                "spent": "0",
                "left": "869",
                "playtime": "89 (0)"
            },
            {
                "uid": "485441587216777216",
                "name": "--K--Alpha",
                "tokens": "171",
                "bonus": "25",
                "spent": "0",
                "left": "171",
                "playtime": "1006 (40)"
            },
            {
                "uid": "420637196610174977",
                "name": "--K--GarpDEez",
                "tokens": "840",
                "bonus": "0",
                "spent": "0",
                "left": "840",
                "playtime": "1507 (0)"
            },
            {
                "uid": "435511103435571223",
                "name": "--K--GoKuu",
                "tokens": "242",
                "bonus": "108",
                "spent": "0",
                "left": "242",
                "playtime": "761 (0)"
            },
            {
                "uid": "287483088349691914",
                "name": "--K--Hyper",
                "tokens": "8",
                "bonus": "8",
                "spent": "0",
                "left": "8",
                "playtime": "0 (0)"
            },
            {
                "uid": "273136012815761408",
                "name": "--K--ipangleo",
                "tokens": "148",
                "bonus": "25",
                "spent": "0",
                "left": "148",
                "playtime": "1533 (0)"
            },
            {
                "uid": "392013460176764928",
                "name": "--K--lastAV",
                "tokens": "393",
                "bonus": "89",
                "spent": "0",
                "left": "393",
                "playtime": "363 (0)"
            },
            {
                "uid": "546557160189067275",
                "name": "--K--Lightscale",
                "tokens": "42",
                "bonus": "0",
                "spent": "0",
                "left": "42",
                "playtime": "544 (4)"
            },
            {
                "uid": "358236068857774080",
                "name": "--K--Limmy",
                "tokens": "613",
                "bonus": "107",
                "spent": "0",
                "left": "613",
                "playtime": "976 (0)"
            },
            {
                "uid": "747287776789135401",
                "name": "--K--Migzzy",
                "tokens": "817",
                "bonus": "0",
                "spent": "485",
                "left": "332",
                "playtime": "5295 (0)"
            },
            {
                "uid": "144811946946985984",
                "name": "--K--OkuuGaming",
                "tokens": "2",
                "bonus": "0",
                "spent": "0",
                "left": "2",
                "playtime": "54 (0)"
            },
            {
                "uid": "233140390818086913",
                "name": "--K--Princess_Snowy",
                "tokens": "16",
                "bonus": "0",
                "spent": "0",
                "left": "16",
                "playtime": "335 (0)"
            },
            {
                "uid": "360973778148392961",
                "name": "--K--Rayne",
                "tokens": "108",
                "bonus": "0",
                "spent": "0",
                "left": "108",
                "playtime": "72 (0)"
            },
            {
                "uid": "309390721897725953",
                "name": "--K--Red_Hood",
                "tokens": "2121",
                "bonus": "275",
                "spent": "1368",
                "left": "753",
                "playtime": "8788 (0)"
            },
            {
                "uid": "1084703654306664528",
                "name": "--K--Strider1202",
                "tokens": "889",
                "bonus": "0",
                "spent": "412",
                "left": "477",
                "playtime": "3094 (0)"
            },
            {
                "uid": "387635651933372437",
                "name": "--K--Yune",
                "tokens": "119",
                "bonus": "0",
                "spent": "0",
                "left": "119",
                "playtime": "456 (0)"
            },
            {
                "uid": "193268903244201984",
                "name": "-AK-AngelImmortaluS7",
                "tokens": "134",
                "bonus": "134",
                "spent": "0",
                "left": "134",
                "playtime": "0 (0)"
            },
            {
                "uid": "208928568304992256",
                "name": "-AK-Kanikou",
                "tokens": "295",
                "bonus": "91",
                "spent": "0",
                "left": "295",
                "playtime": "979 (0)"
            },
            {
                "uid": "311155561385164810",
                "name": "-AK-Lolgod",
                "tokens": "80",
                "bonus": "74",
                "spent": "0",
                "left": "80",
                "playtime": "136 (0)"
            },
            {
                "uid": "185036546347499520",
                "name": "-AK-Molly",
                "tokens": "284",
                "bonus": "22",
                "spent": "0",
                "left": "284",
                "playtime": "5256 (0)"
            },
            {
                "uid": "442069178384515072",
                "name": "-AK-Snake_Eyes",
                "tokens": "529",
                "bonus": "529",
                "spent": "0",
                "left": "529",
                "playtime": "0 (0)"
            },
            {
                "uid": "214372878370471936",
                "name": "-AK-WhiteServant",
                "tokens": "38",
                "bonus": "38",
                "spent": "0",
                "left": "38",
                "playtime": "0 (0)"
            },
            {
                "uid": "312649048190353408",
                "name": "-HK-iSimpForMargulis",
                "tokens": "146",
                "bonus": "25",
                "spent": "0",
                "left": "146",
                "playtime": "731 (26.66666667)"
            },
            {
                "uid": "753940859178713229",
                "name": "-HK-LostLibros",
                "tokens": "102",
                "bonus": "97",
                "spent": "0",
                "left": "102",
                "playtime": "119 (0)"
            },
            {
                "uid": "391531196854697994",
                "name": "-HK-Novulo",
                "tokens": "2",
                "bonus": "2",
                "spent": "0",
                "left": "2",
                "playtime": "0 (0)"
            },
            {
                "uid": "295108470779281409",
                "name": "-IK-minche",
                "tokens": "178",
                "bonus": "178",
                "spent": "0",
                "left": "178",
                "playtime": "0 (0)"
            },
            {
                "uid": "401388359123075082",
                "name": "-IK-SadAce",
                "tokens": "32",
                "bonus": "32",
                "spent": "0",
                "left": "32",
                "playtime": "0 (0)"
            },
            {
                "uid": "274617794409267210",
                "name": "-WK-BobaNoice",
                "tokens": "73",
                "bonus": "65",
                "spent": "0",
                "left": "73",
                "playtime": "165 (0)"
            },
            {
                "uid": "362271593088417794",
                "name": "-WK-Kiku-The-nights-flwr",
                "tokens": "66",
                "bonus": "66",
                "spent": "0",
                "left": "66",
                "playtime": "0 (0)"
            },
            {
                "uid": "177608062494965761",
                "name": "-WK-PasswordXD",
                "tokens": "309",
                "bonus": "307",
                "spent": "0",
                "left": "309",
                "playtime": "40 (0)"
            },
            {
                "uid": "329109761050148865",
                "name": "-YK-Ephemeral",
                "tokens": "25",
                "bonus": "25",
                "spent": "0",
                "left": "25",
                "playtime": "0 (0)"
            },
            {
                "uid": "409782043262713857",
                "name": ".Blacky",
                "tokens": "19",
                "bonus": "19",
                "spent": "0",
                "left": "19",
                "playtime": "0 (0)"
            },
            {
                "uid": "550706441615310870",
                "name": "Aakash07101110",
                "tokens": "399",
                "bonus": "25",
                "spent": "135",
                "left": "264",
                "playtime": "1323 (0)"
            },
            {
                "uid": "267461451067817987",
                "name": "Alanongwarlord",
                "tokens": "29",
                "bonus": "29",
                "spent": "0",
                "left": "29",
                "playtime": "0 (0)"
            },
            {
                "uid": "399720316345122816",
                "name": "Arcotics",
                "tokens": "20",
                "bonus": "0",
                "spent": "0",
                "left": "20",
                "playtime": "270 (0)"
            },
            {
                "uid": "393823990667542539",
                "name": "Asante95",
                "tokens": "118",
                "bonus": "25",
                "spent": "0",
                "left": "118",
                "playtime": "528 (0)"
            },
            {
                "uid": "284150063259713536",
                "name": "CelesteVLR",
                "tokens": "0",
                "bonus": "0",
                "spent": "0",
                "left": "0",
                "playtime": "0 (0)"
            },
            {
                "uid": "426333175757668353",
                "name": "CheesyTalos",
                "tokens": "500",
                "bonus": "25",
                "spent": "200",
                "left": "300",
                "playtime": "1280 (8)"
            },
            {
                "uid": "303793827548889088",
                "name": "coolXX",
                "tokens": "3459",
                "bonus": "196",
                "spent": "1195",
                "left": "2264",
                "playtime": "1728 (13.33333333)"
            },
            {
                "uid": "274344924345008128",
                "name": "DarkOlives",
                "tokens": "0",
                "bonus": "0",
                "spent": "0",
                "left": "0",
                "playtime": "11 (0)"
            },
            {
                "uid": "1049116028552093816",
                "name": "Eion",
                "tokens": "77",
                "bonus": "0",
                "spent": "0",
                "left": "77",
                "playtime": "123 (0)"
            },
            {
                "uid": "412109609164210177",
                "name": "gaevil",
                "tokens": "18",
                "bonus": "8",
                "spent": "0",
                "left": "18",
                "playtime": "206 (0)"
            },
            {
                "uid": "400985757738598400",
                "name": "Gutreis",
                "tokens": "666",
                "bonus": "661",
                "spent": "0",
                "left": "666",
                "playtime": "112 (0)"
            },
            {
                "uid": "302320229403328522",
                "name": "Heitzman",
                "tokens": "36",
                "bonus": "36",
                "spent": "0",
                "left": "36",
                "playtime": "0 (0)"
            },
            {
                "uid": "169454770631737345",
                "name": "HouhYang",
                "tokens": "12",
                "bonus": "0",
                "spent": "0",
                "left": "12",
                "playtime": "246 (0)"
            },
            {
                "uid": "809690396720496661",
                "name": "KomiInnit",
                "tokens": "6",
                "bonus": "6",
                "spent": "0",
                "left": "6",
                "playtime": "0 (0)"
            },
            {
                "uid": "808350734189723708",
                "name": "Kuroirozuki",
                "tokens": "248",
                "bonus": "248",
                "spent": "0",
                "left": "248",
                "playtime": "0 (0)"
            },
            {
                "uid": "453968371914899456",
                "name": "Kxuaii",
                "tokens": "6",
                "bonus": "6",
                "spent": "0",
                "left": "6",
                "playtime": "0 (0)"
            },
            {
                "uid": "346905925203787776",
                "name": "LeadersOnFire",
                "tokens": "4",
                "bonus": "0",
                "spent": "0",
                "left": "4",
                "playtime": "87 (0)"
            },
            {
                "uid": "454600928511787008",
                "name": "LouiseLeBlanc",
                "tokens": "1066",
                "bonus": "25",
                "spent": "0",
                "left": "1066",
                "playtime": "1944 (0)"
            },
            {
                "uid": "358046744275320833",
                "name": "Luksein",
                "tokens": "664",
                "bonus": "25",
                "spent": "400",
                "left": "264",
                "playtime": "1774 (0)"
            },
            {
                "uid": "398870591433736203",
                "name": "Milan",
                "tokens": "62",
                "bonus": "0",
                "spent": "0",
                "left": "62",
                "playtime": "359 (0)"
            },
            {
                "uid": "756885080470978602",
                "name": "Mr.S04",
                "tokens": "59",
                "bonus": "59",
                "spent": "0",
                "left": "59",
                "playtime": "0 (0)"
            },
            {
                "uid": "244819886449229824",
                "name": "NarutoLAuditory",
                "tokens": "7",
                "bonus": "7",
                "spent": "0",
                "left": "7",
                "playtime": "0 (0)"
            },
            {
                "uid": "557901439888785409",
                "name": "NONooBOB",
                "tokens": "172",
                "bonus": "172",
                "spent": "0",
                "left": "172",
                "playtime": "0 (0)"
            },
            {
                "uid": "253971614998331393",
                "name": "Plikie",
                "tokens": "574",
                "bonus": "560",
                "spent": "0",
                "left": "574",
                "playtime": "293 (0)"
            },
            {
                "uid": "708968611691233300",
                "name": "Quantum_Dream",
                "tokens": "63",
                "bonus": "0",
                "spent": "0",
                "left": "63",
                "playtime": "242 (0)"
            },
            {
                "uid": "284971967470239744",
                "name": "Ray.",
                "tokens": "2556",
                "bonus": "497",
                "spent": "0",
                "left": "2556",
                "playtime": "8786 (0)"
            },
            {
                "uid": "314301005695156224",
                "name": "ReiZki",
                "tokens": "162",
                "bonus": "0",
                "spent": "0",
                "left": "162",
                "playtime": "1798 (0)"
            },
            {
                "uid": "166263217998397440",
                "name": "Rvban",
                "tokens": "539",
                "bonus": "31",
                "spent": "0",
                "left": "539",
                "playtime": "848 (0)"
            },
            {
                "uid": "163742894623162369",
                "name": "Serdy",
                "tokens": "6",
                "bonus": "6",
                "spent": "0",
                "left": "6",
                "playtime": "0 (0)"
            },
            {
                "uid": "557193955704569897",
                "name": "Shiramori",
                "tokens": "142",
                "bonus": "142",
                "spent": "0",
                "left": "142",
                "playtime": "0 (0)"
            },
            {
                "uid": "442816543533826050",
                "name": "SNP_MVP",
                "tokens": "105",
                "bonus": "105",
                "spent": "0",
                "left": "105",
                "playtime": "0 (0)"
            },
            {
                "uid": "735755681222623242",
                "name": "SolStreak",
                "tokens": "289",
                "bonus": "25",
                "spent": "0",
                "left": "289",
                "playtime": "404 (0)"
            },
            {
                "uid": "243424930467807242",
                "name": "SoulNotFound",
                "tokens": "5",
                "bonus": "0",
                "spent": "0",
                "left": "5",
                "playtime": "110 (0)"
            },
            {
                "uid": "146874343945666561",
                "name": "TheGreatNappa",
                "tokens": "1045",
                "bonus": "25",
                "spent": "385",
                "left": "660",
                "playtime": "387 (0)"
            },
            {
                "uid": "372395090829901825",
                "name": "TokreDinnye2003",
                "tokens": "23",
                "bonus": "0",
                "spent": "0",
                "left": "23",
                "playtime": "0 (0)"
            },
            {
                "uid": "449198201367560192",
                "name": "Trivago",
                "tokens": "2261",
                "bonus": "1",
                "spent": "0",
                "left": "2261",
                "playtime": "2335 (68)"
            },
            {
                "uid": "489150017815183360",
                "name": "UR2twotalk",
                "tokens": "26",
                "bonus": "0",
                "spent": "0",
                "left": "26",
                "playtime": "60 (0.4666666667)"
            },
            {
                "uid": "370462877913448448",
                "name": "Vixx3n",
                "tokens": "186",
                "bonus": "0",
                "spent": "0",
                "left": "186",
                "playtime": "1202 (0)"
            },
            {
                "uid": "907078962331676722",
                "name": "XbyssalPrime",
                "tokens": "114",
                "bonus": "0",
                "spent": "0",
                "left": "114",
                "playtime": "609 (0)"
            },
            {
                "uid": "740536348166848582",
                "name": "UnKnownnPasta",
                "tokens": "66",
                "bonus": "0",
                "spent": "0",
                "left": "66",
                "playtime": "0 (0)"
            },
            {
                "uid": "",
                "name": "Last_Hope2299",
                "tokens": "13",
                "bonus": "0",
                "spent": "0",
                "left": "0",
                "playtime": "0 (0)"
            }
        ]
        
        // const res = await googleSheets({
        //     spreadsheetId: spreadsheet.farmer.id,
        //     range: spreadsheet.farmer.userName + spreadsheet.farmer.ranges.users,
        // })
        // const workOnData = res.data.values.filter(val => val.length).map((data) => {
        //     return { uid: data[0], name: data[1], tokens: data[2], bonus: data[3], spent: data[4], left: data[5], playtime: data.at(7) ? `${data[6]} (${data[7]})` : data[6] }
        // })
        // return workOnData;
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
                return { uid: userid === '' ? '000000' : userid, name: data[0] === '' ? '#NF!' : data[0], all: run + rad + merch, run, rad, merch }
            }).filter(x => x)
        })
    } else {
        return undefined;
    }
}

async function getAllClanData(clan=undefined) {
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
            // await fs.writeFile(path.join(__dirname, '..', 'data', 'ClanData.json'), JSON.stringify(results.filter(res => res)))
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

/**
 * @param {Client} client 
 */
async function getAllBoxData(client) {
    let boxID, channelArr;

    if (new Date().getTime() - client.lastboxupdate < 60000) {
        return client.boxData ?? {};
    }

    if (process.env.NODE_ENV === 'removed_Temp_development') {
        boxID = collectionBox.testid
        channelArr = collectionBox.testchannels
    } else {
        boxID = collectionBox.id
        channelArr = collectionBox.channels
    }

    const boxChannel =  await client.channels.cache.get(boxID)?.threads;
    if (!boxChannel) {
        logger.warn(`No Threads channel found; failed to update box`);
        client.lastboxupdate = new Date().getTime();
        return {}
    }
    const boxStock = {}

    const matchAny = (a, b) => (a??"").startsWith(b??"") || (b??"").startsWith(a??"")
    const arrOfEntries = Object.entries(channelArr)
    
    await Promise.all(arrOfEntries.map(async ([chnl, cid]) => {
        await boxChannel.fetch(cid).then(/*** @param {ThreadChannel} thread */ async (thread) => {
            if (!thread.messageCount) return;
            const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })
            messages.map((msg) => {
                let parts = msg.content
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/\s*prime\s*/g, ' ')
                    .replace(/\(.*?\)/g, "")
                    .replace(/<@!?[^>]+>/g, "")
                    .replace(/x(\d+)/g, '$1x')
                    .replace(/ and /g, " & ")
                    .trim()
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

                parts = newParts.filter(x => /\dx/.test(x));
                if (!parts.length) return;

                const splitByStock = parts
                    .filter(x => x)
                    .map(part => part
                        .split(/(\b\d+\s*x\b|\bx\s*\d+\b)\s*(.*)/)
                        .map(bystock => {
                    let y = bystock
                    if (/\d/.test(bystock)) {
                        let x_replaced = bystock.replace(/(\d+)x/, '$1')
                        y = parseInt(x_replaced)
                        if (isNaN(y)) y = x_replaced;
                    }
                    return y;
                    }))
                    .map(x => x.filter(y => y))

                for (let part of splitByStock) {
                    part = part.filter(x => x)
                    let nmIndex = part.indexOf(part.find(element => typeof element === 'number'));

                    if (nmIndex == -1 || part.length < 2 || !part.some(x => typeof x == 'string')) { continue; }

                    let updatedAny = false;
                    const boxObj = Object.entries(boxStock);
                    let curPartName = part[~nmIndex & 1].trim().replace(" x2", "")

                    for (const [key, val] of boxObj) {
                        let words = key.split(" ")
                        let x = words, y = words.at(-1);
                        let partText = curPartName.split(' ').filter(x => x)

                        if (partText.slice(0, -1).some(n => matchAny(n, words[0]))) {
                            if (partText[0] == 'magnus' && ['bp', 'receiver', 'reciever', 'barrel'].some(nx => nx.startsWith(partText.at(-1)))) {
                                updatedAny = true
                                boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                break;
                            }
                            else if (partText[0] == 'mag' && ['bp', 'neuroptics', 'blueprint', 'systems', 'chassis'].some(nx => nx.startsWith(partText.at(-1)))) {
                                updatedAny = true
                                boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                break;
                            }
                            else if (partText.length <= 2 ? matchAny(y, partText.at(-1) ?? "00") : (matchAny(x.at(-1) ?? "00", partText.at(-1)) && matchAny(x.at(-2) ?? "00", partText.at(-2)) && matchAny(x.at(-3) ?? "00", partText.at(-3) ?? "00") && matchAny(x.at(-4) ?? "00", partText.at(-4) ?? "00"))) {
                                updatedAny = true
                                boxStock[key] += part[nmIndex]
                                break;
                            }
                        }
                    }

                    if (!updatedAny) { boxStock[curPartName] = part[nmIndex] }
                }
            })
        })
    }))

    const fixedBoxStock = {}
    const jsfile = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')))
    const partNames = [... new Set(jsfile.relicData.map(x => x.parts).flat().filter(x => x))]

    await Promise.all(Object.entries(boxStock).map(async ([part, stock]) => {
        const splitnm = titleCase(part).split(" ")
        let pind = partNames.filter(x => {
            if (splitnm[0] == 'Mag') return x.startsWith('Mag ')
            else if (splitnm[0] == 'Magnus') return x.startsWith('Magnus')
            else return splitnm.length > 2 ? (x.startsWith(splitnm[0]) && matchAny(x.split(" ")[1], splitnm[1]) && matchAny(x.split(" ")[2], splitnm[2]) && matchAny(x.split(" ")[3], splitnm[3])) : x.startsWith(splitnm[0])
        })
        .filter(y => y.split(' ').slice(1).some(
            z => splitnm.slice(1).some(p => z === "BP" ? z === p : z.startsWith(p == 'bp' ? 'BP' : p.slice(0, -1)))))

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

        if (!pind.length) return;
        if (pind[0].includes('x2')) {
            fixedBoxStock[pind.join(" ").replace(" x2", "")] = Math.floor(stock/2);
        } else {
            fixedBoxStock[pind.join(" ")] = stock;
        }
    }))

    client.lastboxupdate = new Date().getTime();
    client.boxData = fixedBoxStock;
    return fixedBoxStock;
    // await fs.writeFile(path.join(__dirname, '..', 'data', 'BoxData.json'), JSON.stringify(fixedBoxStock))
}

const INTACTRELIC = process.env.NODE_ENV === "development" ? "1236313453355073556" : "1193415346229620758"
const RADDEDRELIC = process.env.NODE_ENV === "development" ? "1236313496082317382" : "1193414617490276423"

function parseStringToList(str) {
    // const regex = /\d+x\s*\|\s*[^\|]+?\s*\|\s*\d+\s*ED\s*\|\s*\d+\s*RED\s*\|\s*\d+\s*ORANGE/g;
    const regex = /(\d+x).*( Axi|Meso|Neo|Lith) ([A-Z]\d+)/g;
    const matches = str.matchAll(regex);
    return matches || [];
}

async function retrieveSoupStoreRelics(client) {
    let boxID;

    if (process.env.NODE_ENV === 'development') {
        boxID = collectionBox.testid
    } else {
        boxID = collectionBox.id
    }

    const boxChannel = await client.channels.cache.get(boxID)?.threads;
    if (!boxChannel) return logger.warn(`No Threads channel found; failed to update Soup Store`)

    const relicsMegaJSON = []

    const relicStuff = (await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/RelicData.json')))).relicData
    const positions = ['intact', 'radded']

    await Promise.all(
        [INTACTRELIC, RADDEDRELIC].map(async (RELICSTORE, i) => {
            await boxChannel.fetch(RELICSTORE).then(async (thread) => {
                if (!thread.messageCount) return;
                const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })
                messages.map(/** * @param {Message} msg **/async (msg) => {
                    const Relics = [...parseStringToList(msg.content)].map(x => x[0].replace(/\[0m/g, '').replace(/\[(2;)?34m/g, '').split(/\s*\| /g))
                    if (!Relics.length) return;
                    const authorID = msg.author.id
                    const authorName = msg.author.displayName
                    const authorLink = msg.url

                    const soupInfo = []
                    for (const relic of Relics) {
                        const info = relicStuff.find(x => x.name === relic[1])
                        if (!relic) continue;
                        soupInfo.push({ relic: relic[1], howmany: parseInt(relic[0].replace('x', '')), has: [...new Set(info.parts.filter(x => x).map(y => y.replace(" x2", "")))] })
                    }

                    relicsMegaJSON.push({
                        ID: authorID, link: authorLink, name: authorName, type: positions[i],
                        relics: Relics, parts: soupInfo
                    })
                })
            })
        })
    )

    return relicsMegaJSON;
    // await fs.writeFile(path.join(__dirname, '..', 'data/SoupData.json'), JSON.stringify(relicsMegaJSON))
}

module.exports = { getAllClanData, getAllUserData, getAllRelics, getAllBoxData, retrieveSoupStoreRelics }