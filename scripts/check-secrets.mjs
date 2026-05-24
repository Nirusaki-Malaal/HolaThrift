import { execFileSync } from 'node:child_process';

const runGit = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

const lines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);

const trackedFiles = lines(runGit(['ls-files']));
const trackedEnvFiles = trackedFiles.filter((file) => /^\.env($|\.)/.test(file) && file !== '.env.example');
const envHistory = lines(runGit(['log', '--all', '--format=%H', '--', '.env']));
const envObjectHistory = lines(runGit(['rev-list', '--objects', '--all']))
  .filter((line) => {
    const path = line.split(' ').slice(1).join(' ');
    return /(^|\/)\.env($|\.)/.test(path) && path !== '.env.example';
  });

const secretPattern = [
  'cfsk_',
  'mongodb\\+srv://[^[:space:]]+',
  'CASHFREE_SECRET_KEY="?cfsk_',
  'JWT_SECRET="?[^"[:space:]]{32,}',
  'GMAIL_PASS="?[^"[:space:]]+',
  'CLOUDINARY_API_SECRET="?[^"[:space:]]+',
  'SHIPROCKET_API_KEY="?[^"[:space:]]+',
].join('|');

const secretHits = [];
for (const commit of lines(runGit(['log', '--all', '--format=%H']))) {
  try {
    const matches = lines(runGit(['grep', '-I', '-l', '-E', secretPattern, commit, '--', '.']));
    for (const match of matches) {
      const file = match.replace(`${commit}:`, '');
      if (file === '.env.example') continue;
      secretHits.push(`${commit.slice(0, 12)}:${file}`);
    }
  } catch {
    continue;
  }
}

const failures = [
  ...trackedEnvFiles.map((file) => `Tracked env file: ${file}`),
  ...envHistory.map((commit) => `Exact .env history: ${commit.slice(0, 12)}`),
  ...envObjectHistory.map((entry) => `Env object history: ${entry}`),
  ...secretHits.map((hit) => `Secret-like history hit: ${hit}`),
];

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Secret history check passed');
