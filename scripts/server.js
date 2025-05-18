import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import expressStatusMonitor from 'express-status-monitor';
import webRoutes from './api/webRoutes.js';
import apiRoutes from './api/apiRoutes.js';
import cors from 'cors';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.SERVER_PORT || 8080;

// CORS configuration
const corsOptions = {
    origin: "*",
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 hours
};

app.disable('x-powered-by');
// Initialize express-status-monitor
app.use(expressStatusMonitor());
// Apply CORS with options
app.use(cors(corsOptions));
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
    console.log(`[SERVER] CORS allowed origins: ${corsOptions.origin}`);
});
