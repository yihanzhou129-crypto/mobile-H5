/**
 * 本地预览服务器 - 《如何成为一个优雅的中世纪人》H5小游戏
 * 支持中文路径、UTF-8 编码、路由别名
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.LOCAL_PREVIEW_PORT || '8091', 10);
const ROOT = __dirname;

// 路由别名：URL → 实际文件路径
const routeAliases = {
  '/': '/game/index.html',
  '/nav': '/zeen-tools/nav.html'
};

// MIME 类型映射
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(url.parse(req.url).pathname);

  // 路由别名匹配
  if (routeAliases[urlPath]) {
    urlPath = routeAliases[urlPath];
  }

  // 无扩展名时尝试拼接 .html
  if (!path.extname(urlPath) && !routeAliases[urlPath]) {
    const withHtml = urlPath + '.html';
    const fullPath = path.join(ROOT, withHtml);
    if (fs.existsSync(fullPath)) {
      urlPath = withHtml;
    }
  }

  // 目录请求回退到 index.html
  const fullPath = path.join(ROOT, urlPath);
  let filePath = fullPath;

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    filePath = path.join(fullPath, 'index.html');
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + urlPath);
    return;
  }

  // 读取文件并返回
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  本地预览服务已启动');
  console.log('  ─────────────────────────────');
  console.log('  首页入口:   http://127.0.0.1:' + PORT + '/');
  console.log('  导航页面:   http://127.0.0.1:' + PORT + '/nav');
  console.log('  项目根目录: ' + ROOT);
  console.log('  端口:       ' + PORT);
  console.log('  ─────────────────────────────');
  console.log('  按 Ctrl+C 停止服务');
  console.log('');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('  [错误] 端口 ' + PORT + ' 已被占用。');
    console.error('  请先关闭占用端口的程序，或设置环境变量 LOCAL_PREVIEW_PORT 使用其他端口。');
    console.error('');
    process.exit(1);
  } else {
    throw err;
  }
});
