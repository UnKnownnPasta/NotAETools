module.exports = {
    apps: [{
        name: "AEToolsPROD",
        script: "./src/bot.js",
        cwd: __dirname,
        env: {
          "PORT": 3000,
          "NODE_ENV": "development"
        },
        env_production: {
            "NODE_ENV": "production",
        },
        min_uptime: 100,
        max_restarts: 10,
        watch: true,
        ignore_watch: ["node_modules", "_dev", "src", "data", "storage"],
    }],
};
