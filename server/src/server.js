import app from './app.js';

// Render (and most hosts) tell the app which port to use through PORT.
// Locally we fall back to 5000.
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`StudySlot API listening on port ${PORT}`);
});
