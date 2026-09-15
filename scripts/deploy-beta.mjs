import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
assert(args.every((arg) => arg === '--dry-run'), 'Only --dry-run is supported');
const env = { ...process.env };
delete env.CLOUDFLARE_ENV;

function run(bin, args, environment = env) {
  const result = spawnSync(process.execPath, [bin, ...args], {
    cwd: root, env: environment, stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('node_modules/astro/bin/astro.mjs', ['build', '--mode', 'beta'], {
  ...env, CLOUDFLARE_ENV: 'beta',
});

// Deploy only the flattened beta config produced by the Cloudflare Vite plugin.
const configPath = new URL('../dist/server/wrangler.json', import.meta.url);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
assert.equal(config.name, 'atelier-beta');
assert.equal(config.account_id, '8527ec1369d46f55304a6f59ab5356e4');
assert.deepEqual(config.routes, [{ pattern: 'beta.cjuy.dev', custom_domain: true }]);
assert(config.kv_namespaces?.some(
  ({ binding, id }) => binding === 'SESSION' && id === '02563cfe7ad145a8b805f27e5dd928ec',
));

run('node_modules/wrangler/bin/wrangler.js', [
  'deploy', '--config', fileURLToPath(configPath), ...args,
]);
