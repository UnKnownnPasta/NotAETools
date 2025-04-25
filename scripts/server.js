import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import expressStatusMonitor from 'express-status-monitor';
import { fetchData } from '../src/services/googleSheets.js';
import { updateFissures } from './fissures.js';
import { getMerged } from '../src/managers/stored/getMerged.js'
import { rateLimit } from 'express-rate-limit';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.SERVER_PORT || 8080;

// Initialize express-status-monitor
app.use(expressStatusMonitor());
// Middleware to parse JSON
app.use(express.json());
// Middleware to serve static files
app.use(express.static(__dirname));

const baseLimitter = {
    windowMs: 10 * 60 * 1000,
    max: 100,
    handler: (req, res, next, options) => {
      res.status(options.statusCode).json({ error: 'Rate limit exceeded' });
      next();
    },
    standardHeaders: true,
    legacyHeaders: false,
};

const blobLimiter = rateLimit({
    ...baseLimitter,
    max: 1200,
});
const apiLimiter = rateLimit({
    ...baseLimitter,
    max: 50,
});
const globalLimiter = rateLimit({
    ...baseLimitter,
    max: 150,
});

// Route to force an update
app.get('/forceupdate', apiLimiter, async (req, res) => {
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
app.get('/', globalLimiter, (req, res) => {
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
app.get('/blob/*', blobLimiter, (req, res) => {
    const filePath = path.join(__dirname, '..', req.path);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(404).send('404 Not Found');
        } else {
            const contentType = mime.lookup(filePath) || 'application/octet-stream';
            res.status(200).contentType(contentType).send(data);
        }
    });
});

// Endpoint for fissure updating
app.get('/fissure', async (request, res) => {
    const authHeader = (request.headers["X-Source-Job"] || request.headers["x-source-job"]);
    
    if (!authHeader || authHeader !== process.env.EXPECTED_AUTH_TOKEN) {
      console.error('Unauthorized request to /fissure');
      res.status(401).send('401 Unauthorized');
    }

    try {
      await updateFissures(process.env);
      res.status(200).send('OK!');
    } catch (error) {
      console.error("Error updating fissures:", error);
      res.status(500).send('500 Internal Server Error');
    }
})

// Website endpoint
app.get('/explorer', globalLimiter, (req, res) => {
    const filePath = path.join(__dirname, 'explorer.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('500 Internal Server Error');
        } else {
            res.status(200).contentType('text/html').send(data);
        }
    });
});

app.get('/api/explorer', apiLimiter, async (req, res) => {
    res.json(await getMerged());
})

// Start the server
app.listen(PORT, () => {
    console.log(`[EXPRESS] Server is listening on port \`${PORT}\`!`);
});
