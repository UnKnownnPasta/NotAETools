import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import expressStatusMonitor from 'express-status-monitor';
import { fetchData } from '../src/services/googleSheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.SERVER_PORT || 8080;

// Initialize express-status-monitor
app.use(expressStatusMonitor());

// Middleware to parse JSON
app.use(express.json());

// Route to force an update
app.get('/forceupdate', async (req, res) => {
    const token = decodeURIComponent(req.headers.token);
    if (token === process.env.SUPERTOKEN) {
        try {
            await fetchData();
            res.status(200).send('OK!');
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(403).send('403 Forbidden');
    }
});

// Heartbeat route
app.get('/heartbeat', (req, res) => {
    const badgeData = {
        schemaVersion: 1,
        label: 'status',
        message: 'operational',
        color: 'brightgreen'
    };
    res.status(200).json(badgeData);
});


// Serve about.html file
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'about.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('500 Internal Server Error');
        } else {
            res.status(200).contentType('text/html').send(data);
        }
    });
});

// Serve static files from the /blob/ directory
app.get('/blob/*', (req, res) => {
    const filePath = path.join(__dirname, '..', req.path);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(404).send('404 Not Found');
        } else {
            const extname = path.extname(filePath);
            const contentType = extname === '.png' ? 'image/png' : extname === '.jpg' ? 'image/jpeg' : 'text/plain';
            res.status(200).contentType(contentType).send(data);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
