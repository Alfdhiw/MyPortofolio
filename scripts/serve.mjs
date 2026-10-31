import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export function createStaticServer() {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json; charset=utf-8' };
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      const path = decodeURIComponent(url.pathname);
      if (path.split('/').some(part => part.startsWith('.') && part !== '')) { response.writeHead(403).end('Forbidden'); return; }
      let target = resolve(root, `.${path}`);
      const fromRoot = relative(root, target);
      if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) { response.writeHead(403).end('Forbidden'); return; }
      if ((await stat(target)).isDirectory()) {
        if (!url.pathname.endsWith('/')) { response.writeHead(302, { Location: url.pathname + '/' + url.search }).end(); return; }
        target = resolve(target, 'index.html');
      }
      const bytes = await readFile(target);
      response.writeHead(200, { 'Content-Type': types[extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found'); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = createStaticServer();
  server.listen(Number(process.env.PORT || 4173), '127.0.0.1', () => console.log(`Portfolio: http://127.0.0.1:${server.address().port}`));
}
