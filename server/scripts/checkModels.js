// Development check for the Mongoose models.
// Run from the server folder:  npm run check:models
//
// Part 1 checks validation rules WITHOUT touching the database.
// Part 2 connects to MongoDB, builds the indexes, and proves the unique email
// index works using a temporary @example.com test user that is deleted afterwards.

import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';

let failures = 0;

function check(label, passed) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}`);
  if (!passed) {
    failures += 1;
  }
}

// Returns the list of fields that failed validation (empty if valid).
async function invalidFields(doc) {
  try {
    await doc.validate();
    return [];
  } catch (error) {
    return Object.keys(error.errors || {});
  }
}

async function checkUserValidation() {
  console.log('\n== User: validation (no database) ==');

  const valid = new User({
    name: '  Jordan Rivera  ',
    email: '  Jordan.Rivera@Example.COM ',
    passwordHash: 'fake-hash-for-testing',
  });
  check('valid user passes validation', (await invalidFields(valid)).length === 0);
  check('name is trimmed', valid.name === 'Jordan Rivera');
  check('email is trimmed and lowercased', valid.email === 'jordan.rivera@example.com');

  const json = valid.toJSON();
  check('toJSON hides passwordHash', !('passwordHash' in json));
  check('toJSON renames _id to id', typeof json.id === 'string' && !('_id' in json));
  check('toJSON hides __v', !('__v' in json));

  const missing = await invalidFields(new User({}));
  check(
    'missing name, email, passwordHash are rejected',
    ['name', 'email', 'passwordHash'].every((field) => missing.includes(field))
  );

  const badEmail = await invalidFields(
    new User({ name: 'Jo', email: 'not-an-email', passwordHash: 'x' })
  );
  check('invalid email is rejected', badEmail.includes('email'));

  const shortName = await invalidFields(
    new User({ name: 'J', email: 'j@example.com', passwordHash: 'x' })
  );
  check('1-character name is rejected', shortName.includes('name'));

  const extra = new User({
    name: 'Jo Doe',
    email: 'jo@example.com',
    passwordHash: 'x',
    role: 'admin',
  });
  check('unknown field "role" is dropped (strict mode)', extra.get('role') === undefined);
}

async function checkUserDatabase() {
  console.log('\n== User: database ==');

  await User.init(); // builds the indexes defined in the schema
  const indexes = await User.listIndexes();
  const emailIndex = indexes.find((index) => index.key && index.key.email === 1);
  check('unique index on email exists', Boolean(emailIndex && emailIndex.unique));

  const testEmail = 'model-check@example.com';
  await User.deleteMany({ email: testEmail }); // clean up any leftovers from a past run

  try {
    await User.create({ name: 'Model Check', email: testEmail, passwordHash: 'fake-hash' });

    let duplicateCode = null;
    try {
      await User.create({ name: 'Model Check 2', email: 'MODEL-CHECK@example.com', passwordHash: 'fake-hash' });
    } catch (error) {
      duplicateCode = error.code;
    }
    check('duplicate email (different case) is rejected with code 11000', duplicateCode === 11000);

    const loaded = await User.findOne({ email: testEmail });
    check('passwordHash is NOT loaded by default', loaded.passwordHash === undefined);

    const withHash = await User.findOne({ email: testEmail }).select('+passwordHash');
    check('passwordHash loads only when explicitly selected', withHash.passwordHash === 'fake-hash');
  } finally {
    await User.deleteMany({ email: testEmail });
    console.log('(test user removed)');
  }
}

async function main() {
  await checkUserValidation();

  try {
    await connectToDatabase();
  } catch {
    console.log('\nSkipping database checks: could not connect.');
    process.exitCode = 1;
    return;
  }

  try {
    await checkUserDatabase();
  } finally {
    await disconnectFromDatabase();
  }

  console.log(failures === 0 ? '\nAll model checks passed.' : `\n${failures} check(s) FAILED.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
