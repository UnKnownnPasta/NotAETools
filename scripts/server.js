import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import expressStatusMonitor from 'express-status-monitor';
import webRoutes from './api/webRoutes.js';
import apiRoutes from './api/apiRoutes.js';

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

// Serve static files from public folder as a route
app.use('/public', express.static(path.join(__dirname, '..', 'src', 'web', 'public')));

// Use routes
app.use('/', webRoutes);
app.use('/api', apiRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`[SERVER] Listening on port \`${PORT}\`!`);
});
