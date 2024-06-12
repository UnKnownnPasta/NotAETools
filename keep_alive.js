const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const server = http.createServer((req, res) => {
    if (req.url === '/heartbeat') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.write('OK!');
        res.end();
    } else if (req.url === '/') {
        const filePath = path.join(__dirname, 'about.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.write('500 Internal Server Error');
                res.end();
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(data);
                res.end();
            }
        });
    } else if (req.url.startsWith('/blob/')) {
        const filePath = path.join(__dirname, req.url);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.write('404 Not Found');
                res.end();
            } else {
                const extname = path.extname(filePath);
                let contentType = 'text/plain';
                switch (extname) {
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.jpg':
                        contentType = 'image/jpeg';
                        break;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.write(data);
                res.end();
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write('404 Not Found');
        res.end();
    }
});

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
