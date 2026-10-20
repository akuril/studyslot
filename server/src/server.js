import { config } from './config/env.js';
import { connectToDatabase, disconnectFromDatabase } from './config/db.js';
import app from './app.js';

// Stop waiting for open requests after this long during shutdown.
const SHUTDOWN_TIMEOUT_MS = 10000;

async function start() {
  // 1. Connect to MongoDB FIRST. If it fails, don't accept any requests.
  try {
    await connectToDatabase();
  } catch {
    console.error('Server not started because the database is unavailable.');
    process.exit(1);
  }

  // 2. Only then start accepting HTTP requests.
  const server = app.listen(config.port, () => {
    console.log(`StudySlot API listening on port ${config.port} (${config.nodeEnv})`);
  });

  // 3. Graceful shutdown: finish open requests, close the DB, then exit.
  //    SIGINT = Ctrl + C in the terminal. SIGTERM = the host (Render) stopping the app.
  let isShuttingDown = false;

  async function shutdown(signal) {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;
    console.log(`${signal} received. Shutting down...`);

    // Safety net: if something hangs, exit anyway.
    setTimeout(() => {
      console.error('Shutdown took too long. Forcing exit.');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    server.close(async () => {
      try {
        await disconnectFromDatabase();
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
