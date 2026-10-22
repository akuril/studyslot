// Tries the AI recommendation service ONCE with your real database and AI model,
// before the API endpoint exists. Run from the server folder:
//
//   npm run try:ai -- "My 7th grader is struggling with fractions" 7
//
// The first value is the description (in quotes); the grade (6-12) is optional.
// Uses 1 of your free daily AI requests. Prints the same JSON the app will receive.

import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import { recommendServices } from '../src/services/aiService.js';

const [need, gradeText] = process.argv.slice(2);
const grade = gradeText === undefined ? undefined : Number(gradeText);

if (!need || need.trim() === '' || need.length > 500) {
  console.error('Give a description in quotes (1-500 characters), for example:');
  console.error('  npm run try:ai -- "Needs help with essay writing" 10');
  process.exit(1);
}
if (grade !== undefined && !(Number.isInteger(grade) && grade >= 6 && grade <= 12)) {
  console.error('The grade must be a whole number from 6 to 12.');
  process.exit(1);
}

try {
  await connectToDatabase();
  const result = await recommendServices({ need: need.trim(), grade });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await disconnectFromDatabase();
}
