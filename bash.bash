#!/bin/bash

# Base directory
mkdir -p ./src/{commands,events,services,data,config}
mkdir -p ./tests/{unit,integration}
mkdir -p ./docs
mkdir -p ./scripts

# Create empty files
touch ./src/commands/{relics.js,squads.js,merching.js,index.js}
touch ./src/events/{ready.js,message.js,interaction.js}
touch ./src/services/{warframe.js,googleSheets.js,utils.js}
touch ./src/data/{relics.json,primes.json}
touch ./src/config/{botConfig.json,env.js}
touch ./src/index.js

# Test structure
touch ./tests/unit/.gitkeep
touch ./tests/integration/.gitkeep
touch ./tests/testRunner.js

# Documentation
touch ./docs/{README.md,commands.md}

# Scripts
touch ./scripts/{deployCommands.js,keepAlive.js}

# Root files
touch ./.gitignore
cat >> ./.gitignore << EOF
node_modules
_dev
.env
EOF
touch ./LICENSE

echo "File structure for . has been set up!"
