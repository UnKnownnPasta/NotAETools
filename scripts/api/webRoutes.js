import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimit } from 'express-rate-limit';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const baseLimitter = {
    windowMs: 10 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => {
        return req.headers['user-agent'] || 'anonymous';
    },
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
const globalLimiter = rateLimit({
    ...baseLimitter,
    max: 150,
});

// Serve about.html file
router.get('/', globalLimiter, (req, res) => {
    const filePath = path.join(__dirname, '..', '..', 'src', 'web', 'views', 'about.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('500 Internal Server Error');
        } else {
            res.status(200).contentType('text/html').send(data);
        }
    });
});

// Website endpoint
router.get('/explorer', globalLimiter, (req, res) => {
    const filePath = path.join(__dirname, '..', '..', 'src', 'web', 'views', 'explorer.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('500 Internal Server Error');
        } else {
            res.status(200).contentType('text/html').send(data);
        }
    });
});

// Serve tutorial.html file
router.get('/tutorial', globalLimiter, (req, res) => {
    const filePath = path.join(__dirname, '..', '..', 'src', 'web', 'views', 'tutorial.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(500).send('500 Internal Server Error');
        } else {
            res.status(200).contentType('text/html').send(data);
        }
    });
});

// Serve static files from the /blob/ directory
router.get('/blob/*', blobLimiter, (req, res) => {
    const filePath = path.join(__dirname, '..', '..', req.path);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.status(404).send('404 Not Found');
        } else {
            const contentType = mime.lookup(filePath) || 'application/octet-stream';
            res.status(200).contentType(contentType).send(data);
        }
    });
});

export default router;
