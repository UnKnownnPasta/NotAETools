const { Client } = require("discord.js");
const { departments } = require('../../configs/config.json');
const fs = require('node:fs/promises');
const path = require('node:path');
const database = require('../../database/init.js');
const { titleCase } = require('../../utils/generic.js');

/** * @param {Client} client */
module.exports = async (client) => {
    const boxChannel =  await client.channels.cache.get(departments.treasury.soupstoreThreadID).threads;
    const boxStock = {}

    const matchAny = (a, b) => a.startsWith(b) || b.startsWith(a)
    
    await Promise.all(Object.entries(departments.treasury.soupstoreChannels).map(async ([chnl, cid]) => {

        await boxChannel.fetch(cid).then(/*** @param {ThreadChannel} thread */ async (thread) => {

            const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })

                await Promise.all(messages.map(async (msg) => {
                    let parts = msg.content
                        .toLowerCase()
                        .replace(/\s+/g, ' ')
                        .replace(/\s*prime\s*/, ' ')
                        .replace(/\(.*?\)/g, "")
                        .replace(/<@!?[^>]+>/g, "")
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

                    parts = newParts.filter(x => /\dx/.test(x) && !/[^\w\s]/.test(x));

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
                    }));

                    await Promise.all(splitByStock.map((part) => {
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
                    }))
                }))
            //}) // async msg
        })
    }))

    const fixedBoxStock = {}
    const jsfile = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')))
    const partNames = [... new Set(jsfile.relicData.map(x => x.parts).flat().filter(x => x))]

    await Promise.all(Object.entries(boxStock).map(async ([part, stock]) => {
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

        if (!pind.length) return;
        if (pind[0].includes('x2')) {
            fixedBoxStock[pind.join(" ")] = Math.floor(stock/2);
        } else {
            fixedBoxStock[pind.join(" ")] = stock;
        }
    }))

    // const newObject = []
    // for (const [key, value] of Object.entries(fixedBoxStock)) {
    //     newObject.push({ name: key, stock: parseInt(value) })
    // }

    await fs.writeFile(path.join(__dirname, '..', 'data', 'BoxData.json'), JSON.stringify(fixedBoxStock))
}