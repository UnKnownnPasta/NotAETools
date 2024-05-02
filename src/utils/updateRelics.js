const chalk = require("chalk");
const { execSync } = require("child_process");
const fs = require("node:fs");
const path = require("node:path");

function hasNodemodules(wfcdDirName) {
    const nmPath = path.join(wfcdDirName, 'node_modules');
    try {
      const stats = fs.statSync(nmPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

const WFCDFOLDERPATH = path.resolve(__dirname, '..', '..', 'wfcd-relic-tool');

function runRelicsScript() {
    console.log("[/] " + chalk.redBright("Running npm script to initialize ") + chalk.cyan(`Relics.json`));

    const test = hasNodemodules(WFCDFOLDERPATH);
    if (!test) {
        throw new Error(chalk.red('No `node_modules folder` found for wfcd-relic-tool. Please `cd` into the directory and run `npm i`'))
    }

    console.log("[-] " + `${chalk.yellow('Changing directory to:')} ${chalk.blue("WFCD Relic Tool")}`);
    process.chdir(WFCDFOLDERPATH);

    console.log("[\\] " + chalk.red("Running npm script..."));
    execSync("npm run start", { stdio: "inherit" });
}

function downloadResults() {
    console.log("[-] " + chalk.yellow("Saving results to AETools..."));
    const file = fs.readFileSync(path.join(__dirname,'..', '..', 'wfcd-relic-tool', 'data', 'Relics.json'))

    console.log("[/] " + `${chalk.yellow('Changing directory to:')} ${chalk.blue('AETools ~ Project Folder')}`)
    process.chdir(path.join(__dirname,'..', '..', ));
    console.log("[-] " + chalk.yellow('Copying data...'))
    fs.writeFileSync(path.join(path.join(__dirname,'..', '..', 'src', 'storage', 'Relics.json')), file)
}

async function deploy() {
    try {
        const start = new Date()
        runRelicsScript();
        downloadResults();
        const end = new Date()
        console.log("[~] " + chalk.green(`Update successful in `) + chalk.white(end - start) + chalk.green(` ms.`))
    } catch (error) {
        console.error("Error during deployment:", error);
        process.exit(1);
    }
}

deploy();
