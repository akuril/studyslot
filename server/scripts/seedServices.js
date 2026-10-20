// Seeds (inserts or updates) the StudySlot service catalog.
//
// Run from the server folder:   npm run seed
// Skip the confirmation prompt: npm run seed -- --yes
//
// Safety rules:
//  - Never runs automatically; a developer must run it on purpose.
//  - Matches services by name and UPDATES them in place ("upsert"), so their ids
//    (and every booking that points to them) stay the same. Nothing is deleted.
//  - Shows exactly what will change and asks for confirmation first.
//  - Refuses to run against production unless --allow-production is also given.
//  - Validates every service with the Mongoose schema before writing anything.

import readline from 'node:readline/promises';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import { Service } from '../src/models/Service.js';
import { seedServices } from './data/services.js';

const args = process.argv.slice(2);
const skipPrompt = args.includes('--yes');
const allowProduction = args.includes('--allow-production');

// Step 1: every seed must pass the schema (and names must be unique) before we touch the database.
async function validateSeedData() {
  const problems = [];
  const names = new Set();

  for (const [index, data] of seedServices.entries()) {
    try {
      await new Service(data).validate();
    } catch (error) {
      const fields = Object.values(error.errors || {}).map((fieldError) => fieldError.message);
      problems.push(`#${index + 1} "${data.name}": ${fields.join('; ') || error.message}`);
    }
    if (names.has(data.name)) {
      problems.push(`#${index + 1} "${data.name}": duplicate name in seed file`);
    }
    names.add(data.name);
  }

  return problems;
}

async function confirm(question) {
  if (skipPrompt) {
    return true;
  }
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(question);
  prompt.close();
  return answer.trim().toLowerCase() === 'yes';
}

async function seed() {
  const problems = await validateSeedData();
  if (problems.length > 0) {
    console.error('Seed data is invalid. Nothing was written:');
    problems.forEach((problem) => console.error(`  - ${problem}`));
    process.exitCode = 1;
    return;
  }

  if (config.isProduction && !allowProduction) {
    console.error('NODE_ENV is production. Re-run with --allow-production if you really mean it.');
    process.exitCode = 1;
    return;
  }

  await connectToDatabase();

  try {
    // Step 2: show the plan.
    const seedNames = seedServices.map((service) => service.name);
    const existing = await Service.find({ name: { $in: seedNames } }).select('name');
    const existingNames = new Set(existing.map((service) => service.name));
    const toInsert = seedNames.filter((name) => !existingNames.has(name));
    const toUpdate = seedNames.filter((name) => existingNames.has(name));
    const otherCount = await Service.countDocuments({ name: { $nin: seedNames } });

    console.log(`\nDatabase: ${mongoose.connection.name}`);
    console.log(`Will INSERT ${toInsert.length} new service(s).`);
    console.log(
      `Will UPDATE ${toUpdate.length} existing service(s) by name (their ids stay the same).`,
    );
    if (toUpdate.length > 0) {
      console.log(
        '  WARNING: any manual edits to these services will be replaced by the seed file:',
      );
      toUpdate.forEach((name) => console.log(`    - ${name}`));
    }
    console.log(`Will NOT touch ${otherCount} other service(s). Nothing is deleted.\n`);

    const confirmed = await confirm('Type "yes" to continue: ');
    if (!confirmed) {
      console.log('Cancelled. Nothing was written.');
      return;
    }

    // Step 3: write. One upsert per service, sent to MongoDB in a single batch.
    const result = await Service.bulkWrite(
      seedServices.map((data) => ({
        updateOne: {
          filter: { name: data.name },
          update: { $set: data },
          upsert: true,
        },
      })),
    );

    const total = await Service.countDocuments();
    const active = await Service.countDocuments({ isActive: true });
    console.log(
      `Done. Inserted ${result.upsertedCount}, updated ${result.modifiedCount}, ` +
        `unchanged ${result.matchedCount - result.modifiedCount}.`,
    );
    console.log(`The services collection now has ${total} service(s), ${active} active.`);
  } finally {
    await disconnectFromDatabase();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error.message);
  process.exitCode = 1;
});
