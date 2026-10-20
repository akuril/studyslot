// Development check for the Mongoose models.
// Run from the server folder:  npm run check:models
//
// Part 1 checks validation rules WITHOUT touching the database.
// Part 2 connects to MongoDB, builds the indexes, and proves the unique indexes
// work using temporary test documents that are deleted afterwards.

import { connectToDatabase, disconnectFromDatabase } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';

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
    ['name', 'email', 'passwordHash'].every((field) => missing.includes(field)),
  );

  const badEmail = await invalidFields(
    new User({ name: 'Jo', email: 'not-an-email', passwordHash: 'x' }),
  );
  check('invalid email is rejected', badEmail.includes('email'));

  const shortName = await invalidFields(
    new User({ name: 'J', email: 'j@example.com', passwordHash: 'x' }),
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
      await User.create({
        name: 'Model Check 2',
        email: 'MODEL-CHECK@example.com',
        passwordHash: 'fake-hash',
      });
    } catch (error) {
      duplicateCode = error.code;
    }
    check('duplicate email (different case) is rejected with code 11000', duplicateCode === 11000);

    const loaded = await User.findOne({ email: testEmail });
    check('passwordHash is NOT loaded by default', loaded.passwordHash === undefined);

    const withHash = await User.findOne({ email: testEmail }).select('+passwordHash');
    check(
      'passwordHash loads only when explicitly selected',
      withHash.passwordHash === 'fake-hash',
    );
  } finally {
    await User.deleteMany({ email: testEmail });
    console.log('(test user removed)');
  }
}

// A complete, valid service. Each test changes one field.
function validServiceData(overrides = {}) {
  return {
    name: 'Model Check Service',
    subject: 'math',
    gradeBand: '6-8',
    summary: 'Short summary for testing.',
    description: 'Longer description for testing.',
    tutorName: 'Test Tutor',
    durationMinutes: 60,
    priceCents: 4500,
    ...overrides,
  };
}

async function checkServiceValidation() {
  console.log('\n== Service: validation (no database) ==');

  const valid = new Service(validServiceData({ name: '  Model Check Service  ' }));
  check('valid service passes validation', (await invalidFields(valid)).length === 0);
  check('name is trimmed', valid.name === 'Model Check Service');
  check('isActive defaults to true', valid.isActive === true);

  const json = valid.toJSON();
  check('toJSON renames _id to id', typeof json.id === 'string' && !('_id' in json));
  check('toJSON hides isActive and __v', !('isActive' in json) && !('__v' in json));

  const missing = await invalidFields(new Service({}));
  check(
    'all 8 required fields are rejected when missing',
    [
      'name',
      'subject',
      'gradeBand',
      'summary',
      'description',
      'tutorName',
      'durationMinutes',
      'priceCents',
    ].every((field) => missing.includes(field)),
  );

  check(
    'social-studies is an allowed subject',
    (await invalidFields(new Service(validServiceData({ subject: 'social-studies' })))).length ===
      0,
  );
  check(
    'unknown subject is rejected',
    (await invalidFields(new Service(validServiceData({ subject: 'cooking' })))).includes(
      'subject',
    ),
  );
  check(
    'unknown grade band is rejected',
    (await invalidFields(new Service(validServiceData({ gradeBand: '1-5' })))).includes(
      'gradeBand',
    ),
  );
  check(
    'duration 50 is rejected (only 30/45/60/90)',
    (await invalidFields(new Service(validServiceData({ durationMinutes: 50 })))).includes(
      'durationMinutes',
    ),
  );
  check(
    'negative price is rejected',
    (await invalidFields(new Service(validServiceData({ priceCents: -1 })))).includes('priceCents'),
  );
  check(
    'fractional cents are rejected',
    (await invalidFields(new Service(validServiceData({ priceCents: 45.5 })))).includes(
      'priceCents',
    ),
  );
  check(
    'summary over 160 characters is rejected',
    (await invalidFields(new Service(validServiceData({ summary: 'x'.repeat(161) })))).includes(
      'summary',
    ),
  );
}

async function checkServiceDatabase() {
  console.log('\n== Service: database ==');

  await Service.init();
  const indexes = await Service.listIndexes();
  const nameIndex = indexes.find((index) => index.key && index.key.name === 1);
  const filterIndex = indexes.find(
    (index) =>
      index.key && index.key.isActive === 1 && index.key.subject === 1 && index.key.gradeBand === 1,
  );
  check('unique index on name exists', Boolean(nameIndex && nameIndex.unique));
  check('catalog filter index { isActive, subject, gradeBand } exists', Boolean(filterIndex));

  const testName = 'Model Check Service';
  await Service.deleteMany({ name: testName });

  try {
    await Service.create(validServiceData());

    let duplicateCode = null;
    try {
      await Service.create(validServiceData());
    } catch (error) {
      duplicateCode = error.code;
    }
    check('duplicate service name is rejected with code 11000', duplicateCode === 11000);
  } finally {
    await Service.deleteMany({ name: testName });
    console.log('(test service removed)');
  }
}

async function main() {
  await checkUserValidation();
  await checkServiceValidation();

  try {
    await connectToDatabase();
  } catch {
    console.log('\nSkipping database checks: could not connect.');
    process.exitCode = 1;
    return;
  }

  try {
    await checkUserDatabase();
    await checkServiceDatabase();
  } finally {
    await disconnectFromDatabase();
  }

  console.log(failures === 0 ? '\nAll model checks passed.' : `\n${failures} check(s) FAILED.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
