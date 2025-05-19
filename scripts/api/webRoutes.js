import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateLimit } from 'express-rate-limit';
import mime from 'mime-types';
import crypto from 'node:crypto';

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
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('500 Internal Server Error');
    
    // Generate nonce for CSP
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Replace nonce placeholder in the HTML
    const html = data.replace(/\${nonce}/g, nonce);
    
    res.status(200).type('html').send(html);
  });
};

router.get('/', globalLimiter, serveHTML('about.html'));
router.get('/explorer', globalLimiter, (req, res, next) => {
  // Log request
  console.log(`[${new Date().toISOString()}] Explorer page accessed - User-Agent: ${req.headers['user-agent']}`);
  
  // Generate nonce for CSP
  const nonce = crypto.randomBytes(16).toString('base64');
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'`);
  
  // Serve the HTML file with the same nonce
  const filePath = path.join(__dirname, '..', '..', 'src', 'web', 'views', 'explorer.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('500 Internal Server Error');
    
    // Replace nonce placeholder in the HTML
    const html = data.replace(/\${nonce}/g, nonce);
    
    res.status(200).type('html').send(html);
  });
});
router.get('/tutorial', globalLimiter, serveHTML('tutorial.html'));

router.get('/blob/*', blobLimiter, (req, res) => {
  const filePath = path.join(__dirname, '..', '..', req.path);
  fs.readFile(filePath, (err, data) => {
    if (err) return res.status(404).send('404 Not Found');
    res.status(200).type(mime.lookup(filePath) || 'application/octet-stream').send(data);
  });
});

export default router;
