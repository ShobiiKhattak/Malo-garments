import { execSync } from 'child_process';
import path from 'path';

process.env.DATABASE_URL = 'mysql://root@127.0.0.1:3306/malo_garments';

try {
  const result = execSync(
    `node "${path.join(__dirname, 'node_modules', 'prisma', 'dist', 'prisma.js')}" generate --schema="${path.join(__dirname, 'prisma', 'schema.prisma')}"`,
    { cwd: __dirname, encoding: 'utf8', timeout: 60000, env: { ...process.env } }
  );
  console.log('OUTPUT:', result);
} catch (e: any) {
  console.log('STDOUT:', e.stdout);
  console.log('STDERR:', e.stderr);
  console.log('Error:', e.message);
}
