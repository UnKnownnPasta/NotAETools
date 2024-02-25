![Static Badge](https://img.shields.io/badge/made_with-discord.js_v14-blue) ![Static Badge](https://img.shields.io/badge/license-MIT-green)

# AETools - Recreated
A multipurpose utility bot created to aid warframe players

# Brief history
This project is dedicated towards recreating Warframes "Anime Empire" staff bot - AETools, used in treasury and farmers as a tool of convenience. This rewrite also focuses on adding sought-after features and new capabilities to the bot.

AETools handles data dynamically - from google sheets to waframe apis, and allows it to be displayed in a user friendly manner.

The bot is Discord.js v14 compatible - yet it still depends on message command, for the sake of convenience.

# Running the project
Clone the project and install necessary packages, then run it:
```
git clone -b master https://github.com/UnKnownnPasta/NotAETools.git
npm i --save
node scripts/deploy.js
node .
```

Uses environment keys and `scripts/deploy.js` for deploying slash commands.
Needs `Node.js` v18.x.x or greater

# Credits
Created by [dePasta](https://github.com/UnKnownnPasta), original bot idea from [Zlushiie](https://github.com/Zlushiie)

# Features
The bot has many capabilities, to name a few:
- Saving and updating data from google spreadsheets, and manipulate as:
    - Filter by requirements
    - Batch retrieve data as per conditions
    - Dynamically compare data
- Host treasury runs, farmer runs with ease
- Utilizing data stored in bot, make a merchant list of relics
...and more
