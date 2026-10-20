// Reads, checks, and exports every environment variable the server uses.
// The rest of the code imports `config` from here instead of reading process.env
// directly, so there is ONE place to see what the server needs.
//
// Values come from server/.env locally (loaded by Node's --env-file-if-exists flag
// before any code runs) and from the host's dashboard in production.
// NEVER log these values.

const NODE_ENVS = ['development', 'production', 'test'];
const MIN_JWT_SECRET_LENGTH = 32;
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173';

// Returns the trimmed value, or '' if the variable is missing or blank.
function read(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

// Stops the server with a clear message. Names only, never values.
function fail(message) {
  console.error(`Configuration error: ${message}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

const nodeEnv = read('NODE_ENV') || 'development';
if (!NODE_ENVS.includes(nodeEnv)) {
  fail(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}.`);
}
const isProduction = nodeEnv === 'production';

const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((name) => read(name) === '');
if (isProduction && read('CLIENT_ORIGIN') === '') {
  missing.push('CLIENT_ORIGIN');
}
if (missing.length > 0) {
  fail(`missing required variables: ${missing.join(', ')}.`);
}

const port = read('PORT') === '' ? 5000 : Number(read('PORT'));
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  fail('PORT must be a whole number between 1 and 65535.');
}

if (read('JWT_SECRET').length < MIN_JWT_SECRET_LENGTH) {
  fail(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long.`);
}

const aiApiKey = read('AI_API_KEY');
const aiModel = read('AI_MODEL');

export const config = Object.freeze({
  nodeEnv,
  isProduction,
  port,
  mongodbUri: read('MONGODB_URI'),
  jwtSecret: read('JWT_SECRET'),
  jwtExpiresIn: read('JWT_EXPIRES_IN') || '1d',
  clientOrigin: read('CLIENT_ORIGIN') || DEFAULT_CLIENT_ORIGIN,
  ai: Object.freeze({
    provider: read('AI_PROVIDER') || 'openrouter',
    model: aiModel,
    apiKey: aiApiKey,
    // The AI feature is optional at startup: without a key and model,
    // the recommendation endpoint will use its non-AI fallback.
    isConfigured: aiApiKey !== '' && aiModel !== '',
  }),
});
