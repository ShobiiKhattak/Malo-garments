/*
 * Prisma module resolution patch
 * Imported first thing in server.ts.
 *
 * Fixes ".prisma/client/default" resolution on Windows Node v24
 * where the module exports restriction in .prisma/client/package.json
 * prevents correct resolution.
 */
import Module from 'module';
import path from 'path';

const PRISMA_CLIENT_DIR = path.join(__dirname, 'node_modules', '.prisma', 'client');

const _origResolve = (Module as any)._resolveFilename.bind(Module);
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request === '.prisma/client/default') {
    return path.join(PRISMA_CLIENT_DIR, 'default.js');
  }
  if (request === '.prisma/client/index') {
    return path.join(PRISMA_CLIENT_DIR, 'index.js');
  }
  if (request === '.prisma/client/edge') {
    return path.join(PRISMA_CLIENT_DIR, 'edge.js');
  }
  return _origResolve(request, parent, isMain, options);
};
