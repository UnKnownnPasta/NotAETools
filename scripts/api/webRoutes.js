import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimit } from 'express-rate-limit';
import mime from 'mime-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const baseLimiter = {
  windowMs: 10 * 60 * 1000,
  keyGenerator: req => req.headers['user-agent'] || 'anonymous',
  handler: (req, res, _, options) => {
    res.status(options.statusCode).json({ error: 'Rate limit exceeded' });
  },
  standardHeaders: true,
  legacyHeaders: false,
};

const blobLimiter = rateLimit({ ...baseLimiter, max: 1200 });
const globalLimiter = rateLimit({ ...baseLimiter, max: 150 });

const serveHTML = (filename) => (req, res) => {
  const filePath = path.join(__dirname, '..', '..', 'src', 'web', 'views', filename);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(500).send('500 Internal Server Error');
    res.status(200).type('html').send(data);
  });
};

router.get('/', globalLimiter, serveHTML('about.html'));
router.get('/explorer', globalLimiter, serveHTML('explorer.html'));
router.get('/tutorial', globalLimiter, serveHTML('tutorial.html'));

router.get('/blob/*', blobLimiter, (req, res) => {
  const filePath = path.join(__dirname, '..', '..', req.path);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(404).send('404 Not Found');
    res.status(200).type(mime.lookup(filePath) || 'application/octet-stream').send(data);
  });
});

export default router;
