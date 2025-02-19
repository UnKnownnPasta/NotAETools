const eDef = {
  "type__normal": "1287248821461454910",
  "type__steelpath": "1287249765091905620",
  "hex__embed__invis": 2894900,//"#2c2c34"
  "hex__embed__timers": 11969919,//"#b6a57f"
}

class EmbedBuilder {
  constructor() {
    this.embed = {
      title: "",
      description: "",
      color: 0x0099ff,
      fields: [],
    };
  }

  setTitle(title) {
    this.embed.title = title;
    return this;
  }

  setDescription(description) {
    this.embed.description = description;
    return this;
  }

  setColor(color) {
    this.embed.color = color;
    return this;
  }

  setAuthor({ name, iconURL }) {
    this.embed.author = { name, icon_url: iconURL };
    return this;
  }

  addField(name, value, inline = false) {
    this.embed.fields.push({ name, value, inline });
    return this;
  }

  setFields(fields) {
    this.embed.fields = fields;
    return this;
  }

  setTimestamp(timestamp = new Date()) {
    this.embed.timestamp = timestamp.toISOString();
    return this;
  }

  setFooter({ text, iconURL }) {
    this.embed.footer = { text, icon_url: iconURL };
    return this;
  }

  build() {
    return this.embed;
  }
}

function titleCase(str) {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

async function getWarframeData() {
  const response = await fetch('https://api.warframestat.us/pc/fissures').then(res => res.json());
  return response;
}

function getFissureTimings(fisTimes) {
  const currentTime = Math.floor(new Date().getTime() / 1000);

  const tierMap = new Map();

  fisTimes.forEach(([tier, expiryTime]) => {
      const farthestTime = tierMap.get(tier);
      
      if ((!farthestTime) || Math.abs(expiryTime - currentTime) > Math.abs(farthestTime - currentTime)) {
          tierMap.set(tier, expiryTime);
      }
  });

  const updatedTierMap = new Map();

  tierMap.forEach((farthestTime, tier) => {
      const farthestExpiryTime = farthestTime - 3 * 60;
      const farthestElement = fisTimes.find(([currentTier, expiryTime]) => {
          return currentTier === tier && Math.abs(expiryTime - farthestExpiryTime) <= 180 && expiryTime - currentTime > 0;
      });

      if (farthestElement) {
          updatedTierMap.set(tier, farthestExpiryTime);
      }
  });

  return updatedTierMap;
}

export async function updateFissures(env) {
    const fissureData = await getWarframeData();
    
    const missions = ["Extermination", "Capture", "Sabotage", "Rescue"];
    const tiers = ["Lith", "Meso", "Neo", "Axi"];

    /** CREATE EMBED FOR NORMAL AND SP FISSURES */
    const fissureArray = fissureData.filter(({ tier, missionType, active, expired, isStorm }) =>
        !isStorm && missions.includes(missionType) && active && tiers.includes(tier) && !expired
    );

    const fissures = await fissureArray.map(({ tier, missionType, node, expiry, isHard }) => [
        titleCase(tier),
        `${missionType} - ${node} - Ends <t:${(new Date(expiry).getTime() / 1000) | 0}:R>\n`,
        isHard,
    ]);

    /** (1.1) Reduce fissures into embeds */
    const [N_Embed, S_Embed] = Object.entries(fissures.reduce((acc, fissure) => {
        let currentEmbed = fissure[2] ? acc.S_Embed : acc.N_Embed;
        
        if (fissure[1].includes("Stribog (Void)")) return acc;

        currentEmbed[fissure[0]]
        ? (currentEmbed[fissure[0]].value += fissure[1])
        : (currentEmbed[fissure[0]] = { name: fissure[0], value: fissure[1] });

        return acc;
        }, { N_Embed: {}, S_Embed: {} }
    ));

    /** (1.2) Create sorted embeds for normal and SP fissures */
    const embedSort = (embed) => Object.values(embed[1]).sort((a, b) => tiers.indexOf(a.name) - tiers.indexOf(b.name));

    const NormEmbed = new EmbedBuilder()
        .setAuthor({ name: "Regular Fissures", iconURL: `https://cdn.discordapp.com/emojis/${eDef.type__normal}.png` })
        .setColor(eDef.hex__embed__invis)
        .setFields(embedSort(N_Embed));

    const SPEmbed = new EmbedBuilder()
        .setAuthor({ name: "Steel Path Fissures", iconURL: `https://cdn.discordapp.com/emojis/${eDef.type__steelpath}.png` })
        .setFields(embedSort(S_Embed))
        .setColor(eDef.hex__embed__invis)
        .setTimestamp();

    if (NormEmbed.embed.fields.length == 0) NormEmbed.setDescription(`No ideal fissures`);
    if (SPEmbed.embed.fields.length == 0) SPEmbed.setDescription(`No ideal fissures`);

    /** (1.3) Create a embed to show when the next reset happens  */
    const emojiObj = { 
        "Lith": "<:LithRelicIntact:1287249967475458078>", 
        "Meso": "<:MesoRelicIntact:1287250081380044801>", 
        "Neo": "<:NeoRelicIntact:1287250258765545502>", 
        "Axi": "<:AxiRelicIntact:1287250368299925524>" 
    };

    const timeArrOfObj = [];
    const fisTimes = getFissureTimings(
        fissureData
            .filter(({ tier, isStorm, expired, active }) => tiers.includes(tier) && !isStorm && !expired && active)
            .map(({ isHard, tier, expiry }) => [
                isHard + " " + tier, (new Date(expiry).getTime() / 1000) | 0
            ])
    );

    Array
      .from(fisTimes.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([key, val]) => {
        timeArrOfObj.push({ era: key, time: `<t:${val}:R>` })
    });
    
    const allTimeObjs = Object.entries(timeArrOfObj.reduce((acc, { era, time }) => {
        const [ status, erra ] = era.split(' ')
        let currentEmbed = acc[`${erra}time`];

        if (!currentEmbed.norm && status == 'false') currentEmbed.norm = time;
        else if (!currentEmbed.sp && status == 'true') currentEmbed.sp = time;

        return acc;
    }, {
        Lithtime: { norm: undefined, sp: undefined },
        Mesotime: { norm: undefined, sp: undefined },
        Neotime: { norm: undefined, sp: undefined },
        Axitime: { norm: undefined, sp: undefined },
    }));

    const timeObjSort = (embed, type) => embed
        .sort((a, b) => tiers.indexOf(a[0].replace('time', '')) - tiers.indexOf(b[0].replace('time', '')))
        .map(c => `${emojiObj[c[0].replace('time', '')]} ${c[1][type] ?? 'Awaiting reset'}`);

    const NextFissuresEmbed = new EmbedBuilder()
      .setColor(eDef.hex__embed__timers)
      .setFields([
          { name: "Regular", value: timeObjSort(allTimeObjs, 'norm').join("\n"), inline: true },
          { name: "Steel Path", value: timeObjSort(allTimeObjs, 'sp').join("\n"), inline: true }
      ])
      .setFooter({ text: "Next Fissure Reset Timers / by era", iconURL: null })
      .build();

    /** UPDATE FISSURE MESSAGE WITH CREATED EMBEDS */
    await updateChannelMessage(env, { content: null, embeds: [NormEmbed.build(), SPEmbed.build(), NextFissuresEmbed] });
}

async function updateChannelMessage(env, data) {
  const url = `https://discord.com/api/v10/channels/${env.F_CHANNELID}/messages/${env.F_MESSAGEID}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (https://github.com/UnKnownnPasta/NotAETools, 1.0.0)",
      Authorization: `Bot ${env.DISCORD_TOKEN}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error("Failed to update Discord message", await response.text());
  }
}
