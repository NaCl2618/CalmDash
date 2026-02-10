// Test wrapper for constants.js
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load and evaluate constants.js
const constantsPath = join(__dirname, '..', 'constants.js');
const code = readFileSync(constantsPath, 'utf-8');

// Execute in a sandboxed context
const sandbox = { console };
const func = new Function(...Object.keys(sandbox), code + '\nreturn { INITIAL_DATA, WEATHER_ICONS };');
const exported = func(...Object.values(sandbox));

export const { INITIAL_DATA, WEATHER_ICONS } = exported;
