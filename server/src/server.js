import { config } from './config/env.js';
import app from './app.js';

app.listen(config.port, () => {
  console.log(`StudySlot API listening on port ${config.port} (${config.nodeEnv})`);
});
