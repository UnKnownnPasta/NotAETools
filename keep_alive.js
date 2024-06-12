const http = require('http');
const fs = require('fs');
const path = require('path');
const marked = require('marked');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');

const staticDirPath = path.join(__dirname, 'blob');

const serve = serveStatic(staticDirPath);

const markdownFilePath = path.join(__dirname, 'README.md');
const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');

const htmlContent = marked.marked(markdownContent);

const fullHtmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown Page</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/primer/16.0.0-1/build.css">
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            color: #333;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: left;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            width: 80%;
            max-width: 800px;
            height: 90vh;
            overflow-y: scroll;
        }
    </style>
</head>
<body>
    <div class="container markdown-body">
        ${htmlContent}
    </div>
</body>
</html>
`;

http.createServer((req, res) => {
    if (req.url.startsWith('/blob/')) {
        serve(req, res, finalhandler(req, res));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(fullHtmlContent);
        res.end();
    }
}).listen(8080, () => {
    console.log('Server is listening on port 8080');
});
