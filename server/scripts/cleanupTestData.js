// Deletes the test accounts created by the Postman collection, and their bookings.
//
// Run from the server folder:   npm run cleanup:test-data
// Skip the confirmation prompt: npm run cleanup:test-data -- --yes
//
// Only touches users whose email matches the Postman pattern
//   parent-a-<number>@example.com  /  parent-b-<number>@example.com
// (plus the bookings those users own). Real accounts are never matched.
// Refuses to run against production unless --allow-production is also given.

import readline from 'node:readline/promises';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Booking } from '../src/models/Booking.js';

const TEST_EMAIL_PATTERN = /^parent-[ab]-\d+@example\.com$/;

const args = process.argv.slice(2);
const skipPrompt = args.includes('--yes');
const allowProduction = args.includes('--allow-production');

async function confirm(question) {
  if (skipPrompt) {
    return true;
  }
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(question);
  prompt.close();
  return answer.trim().toLowerCase() === 'yes';
}

async function cleanup() {
  if (config.isProduction && !allowProduction) {
    console.error('NODE_ENV is production. Re-run with --allow-production if you really mean it.');
    process.exitCode = 1;
    return;
  }

  await connectToDatabase();

  try {
    const testUsers = await User.find({ email: TEST_EMAIL_PATTERN }).select('_id');
    const userIds = testUsers.map((user) => user._id);
    const bookingCount = await Booking.countDocuments({ user: { $in: userIds } });

    console.log(`\nDatabase: ${mongoose.connection.name}`);
    console.log(
      `Will DELETE ${userIds.length} Postman test user(s) (parent-a/b-<number>@example.com)`,
    );
    console.log(`and the ${bookingCount} booking(s) they own. Other data is not touched.\n`);

    if (userIds.length === 0) {
      console.log('Nothing to clean up.');
      return;
    }

    const confirmed = await confirm('Type "yes" to permanently delete them: ');
    if (!confirmed) {
      console.log('Cancelled. Nothing was deleted.');
      return;
    }

    // Bookings first, so no booking is ever left pointing at a deleted user.
    const bookings = await Booking.deleteMany({ user: { $in: userIds } });
    const users = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`Deleted ${users.deletedCount} user(s) and ${bookings.deletedCount} booking(s).`);
  } finally {
    await disconnectFromDatabase();
  }
}

cleanup().catch((error) => {
  console.error('Cleanup failed:', error.message);
  process.exitCode = 1;
});
