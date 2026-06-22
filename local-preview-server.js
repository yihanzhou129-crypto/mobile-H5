/**
 * 本地预览服务器 - 《如何成为一个优雅的中世纪人》H5小游戏
 * 支持中文路径、UTF-8 编码、路由别名
 *
 * 关键设计：把游戏静态根目录指向 game/，这样 game/index.html 里
 * 的相对资源（css/style.css、js/game.js）才能被正确解析。
 * 素材用 ../ 引用，通过 aliases 映射回项目根的对应目录。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.LOCAL_PREVIEW_PORT || '8091', 10);
const PROJECT_ROOT = __dirname;
// 游戏静态根：CSS/JS 都相对它引用
const GAME_ROOT = path.join(PROJECT_ROOT, 'game');

// URL 前缀 → 物理目录 的挂载映射
// 顺序：更具体的前缀放前面，避免被通配前缀吞掉
const mountPrefixes = [
  // zeen-tools 资源挂在 /zeen-tools/
  { url: '/zeen-tools/', dir: path.join(PROJECT_ROOT, 'zeen-tools') },
  // 素材目录挂在 /素材/ 下，供游戏内 ../X/ 引用回退（主用别名）
  { url: '/素材/首页及过场页面等素材/', dir: path.join(PROJECT_ROOT, '首页及过场页面等素材') },
  { url: '/素材/场景图/', dir: path.join(PROJECT_ROOT, '场景图') },
  { url: '/素材/人格卡牌图/', dir: path.join(PROJECT_ROOT, '人格卡牌图') },
  { url: '/首页及过场页面等素材/', dir: path.join(PROJECT_ROOT, '首页及过场页面等素材') },
  { url: '/场景图/', dir: path.join(PROJECT_ROOT, '场景图') },
  { url: '/人格卡牌图/', dir: path.join(PROJECT_ROOT, '人格卡牌图') },
];

// 精确路由别名：URL → 物理文件绝对路径
const routeAliases = {
  '/':            path.join(GAME_ROOT, 'index.html'),          // 游戏首页 = game/index.html
  '/game':        path.join(GAME_ROOT, 'index.html'),
  '/game/':       path.join(GAME_ROOT, 'index.html'),
  '/nav':         path.join(PROJECT_ROOT, 'zeen-tools', 'nav.html')
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

// URL → 物理文件路径 解析器（同时返回已 decode 的路径，供错误信息复用）
function resolveFile(requestPath) {
  const rawPath = url.parse(requestPath).pathname;
  // decodeURIComponent 对非法字节序列会抛 URIError，做兜底
  let decoded;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch (e) {
    decoded = Buffer.from(rawPath, 'utf-8').toString('utf-8');
  }

  // 1) 精确别名（直接返回绝对路径）
  if (routeAliases[decoded] !== undefined) {
    return { filePath: routeAliases[decoded], decoded };
  }

  // 2) 挂载前缀匹配（中文目录别名）
  for (const m of mountPrefixes) {
    if (decoded.startsWith(m.url)) {
      const rest = decoded.slice(m.url.length);
      return { filePath: path.join(m.dir, rest), decoded };
    }
  }

  // 3) 默认：相对 game 根目录解析（CSS/JS 的相对引用就是这里命中）
  return { filePath: path.join(GAME_ROOT, decoded), decoded };
}

const server = http.createServer((req, res) => {
  let filePath, decodedPath;
  try {
    const r = resolveFile(req.url);
    filePath = r.filePath;
    decodedPath = r.decoded;
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request: ' + e.message);
    return;
  }

  // 目录请求回退到 index.html
  if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // 检查文件是否存在
  if (!filePath || !fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: ' + (decodedPath || req.url));
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
  console.log('  静态根目录: ' + GAME_ROOT);
  console.log('  项目根目录: ' + PROJECT_ROOT);
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
