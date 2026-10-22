// Creates a TUTOR account for every tutor name in the service catalog, and links
// each service to its tutor's account. Run AFTER `npm run seed`.
//
// Run from the server folder:   npm run seed:tutors
// Skip the confirmation prompt: npm run seed:tutors -- --yes
//
// Tutor accounts can't be created through sign-up (sign-up always makes a parent),
// so this script is the only way they are made.
//
// Login emails are made from the tutor's name: "Ms. Avery Lane" -> avery.lane@tutors.studyslot.example
// (.example is a reserved domain, so these can never be real inboxes).
// Every NEW tutor account gets the password in TUTOR_SEED_PASSWORD (server/.env).
// That variable is only needed while running this script; never commit its value.
//
// Safe to run again: existing tutor accounts are kept as they are (passwords are not
// changed), and services are re-linked by tutor name. Nothing is deleted.

import readline from 'node:readline/promises';
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { hashPassword } from '../src/services/authService.js';

const EMAIL_DOMAIN = 'tutors.studyslot.example';
const TITLES = /^(ms|mr|mrs|mx|dr|sra|sr|mme|m)\.?\s+/i;

const args = process.argv.slice(2);
const skipPrompt = args.includes('--yes');
const allowProduction = args.includes('--allow-production');

/** "Ms. Avery Lane" -> "avery.lane@tutors.studyslot.example" */
export function tutorEmail(tutorName) {
  const withoutTitle = tutorName.replace(TITLES, '');
  const local = withoutTitle
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // é -> e
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${local}@${EMAIL_DOMAIN}`;
}

function readSeedPassword() {
  const password = process.env.TUTOR_SEED_PASSWORD || '';
  const valid =
    password.length >= 8 &&
    Buffer.byteLength(password, 'utf8') <= 72 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password);
  return valid ? password : null;
}

async function confirm(question) {
  if (skipPrompt) return true;
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(question);
  prompt.close();
  return answer.trim().toLowerCase() === 'yes';
}

async function seedTutors() {
  if (config.isProduction && !allowProduction) {
    console.error('NODE_ENV is production. Re-run with --allow-production if you really mean it.');
    process.exitCode = 1;
    return;
  }

  const password = readSeedPassword();
  if (!password) {
    console.error(
      'Set TUTOR_SEED_PASSWORD in server/.env first: at least 8 characters, with a letter and a number.',
    );
    process.exitCode = 1;
    return;
  }

  await connectToDatabase();
  try {
    const tutorNames = (await Service.distinct('tutorName')).sort();
    if (tutorNames.length === 0) {
      console.error('No services found. Run `npm run seed` first.');
      process.exitCode = 1;
      return;
    }

    const plan = await Promise.all(
      tutorNames.map(async (name) => {
        const email = tutorEmail(name);
        const existing = await User.findOne({ email });
        return { name, email, existing };
      }),
    );

    const blocked = plan.filter((item) => item.existing && item.existing.role !== 'tutor');
    if (blocked.length > 0) {
      console.error('These emails already belong to PARENT accounts. Nothing was written:');
      blocked.forEach((item) => console.error(`  - ${item.email}`));
      process.exitCode = 1;
      return;
    }

    const toCreate = plan.filter((item) => !item.existing);
    console.log(`\nDatabase: ${mongoose.connection.name}`);
    console.log(`Tutors in the catalog: ${plan.length}`);
    console.log(`Will CREATE ${toCreate.length} tutor account(s) with TUTOR_SEED_PASSWORD.`);
    console.log(`Will KEEP ${plan.length - toCreate.length} existing tutor account(s) unchanged.`);
    console.log('Will LINK every service to its tutor account by tutor name.\n');

    if (!(await confirm('Type "yes" to continue: '))) {
      console.log('Cancelled. Nothing was written.');
      return;
    }

    const passwordHash = await hashPassword(password);
    let linked = 0;
    for (const item of plan) {
      const tutor =
        item.existing ||
        (await User.create({ name: item.name, email: item.email, passwordHash, role: 'tutor' }));
      const result = await Service.updateMany(
        { tutorName: item.name },
        { $set: { tutor: tutor._id } },
      );
      linked += result.matchedCount;
    }

    console.log(`Done. Linked ${linked} service(s).`);
    console.log('\nTutor logins (password = your TUTOR_SEED_PASSWORD):');
    plan.forEach((item) => console.log(`  ${item.email.padEnd(45)} ${item.name}`));
  } finally {
    await disconnectFromDatabase();
  }
}

// Only run when started as a script (tests import tutorEmail without running it).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedTutors().catch((error) => {
    console.error('Seeding tutors failed:', error.message);
    process.exitCode = 1;
  });
}
