import mongoose from 'mongoose';
import { config } from './env.js';

// How long to keep trying to reach MongoDB before giving up (milliseconds).
const SERVER_SELECTION_TIMEOUT_MS = 10000;

// Mongoose's numeric connection states, as words for the health route.
const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

// Hides "user:password@" if a driver error message ever includes a connection string.
function redactCredentials(text) {
  return String(text).replace(/\/\/[^@\s/]+@/g, '//<credentials>@');
}

// A short hint for the most common Atlas problems. Logged on the server only.
function getConnectionHint(error) {
  const message = String(error && error.message);

  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return 'DNS lookup failed. Check the cluster address, VPN, or DNS settings.';
  }
  if (/auth|Authentication failed/i.test(message)) {
    return 'Authentication failed. Check the database username and password in MONGODB_URI.';
  }
  if (/Server selection timed out|whitelist|IP/i.test(message)) {
    return 'Could not reach the cluster. Check Atlas Network Access (your current IP) and that the cluster is not paused.';
  }
  return 'Check MONGODB_URI and the Atlas cluster status.';
}

/** Connects once at startup. Throws if the connection fails. */
export async function connectToDatabase() {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    });
  } catch (error) {
    console.error('MongoDB connection failed:', redactCredentials(error.message));
    console.error('Hint:', getConnectionHint(error));
    throw new Error('Database connection failed');
  }

  // Safe success message: the database name only, never the URI.
  console.log(`MongoDB connected (database: ${mongoose.connection.name})`);

  // Log later connection problems (for example, a network blip) without crashing.
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));
  mongoose.connection.on('error', (error) =>
    console.error('MongoDB error:', redactCredentials(error.message))
  );
}

/** Closes the connection (used during shutdown and by scripts). */
export async function disconnectFromDatabase() {
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
}

/** 'connected', 'connecting', 'disconnecting', or 'disconnected'. */
export function getDatabaseStatus() {
  return STATES[mongoose.connection.readyState] || 'unknown';
}
