import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { FieldErrors, readString } from '../utils/validation.js';
import { hashPassword, verifyPassword, signToken } from '../services/authService.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores anything after 72 bytes

// Passwords are NOT trimmed: spaces are allowed and must match exactly.
function readNewPassword(body, errors) {
  const password = body.password;

  if (password === undefined || password === null || password === '') {
    errors.add('password', 'Password is required');
    return undefined;
  }
  if (typeof password !== 'string') {
    errors.add('password', 'Password must be text');
    return undefined;
  }
  if (password.length < PASSWORD_MIN) {
    errors.add('password', `Password must be at least ${PASSWORD_MIN} characters`);
    return undefined;
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    errors.add('password', 'Password is too long (maximum 72 characters)');
    return undefined;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.add('password', 'Password must include at least one letter and one number');
    return undefined;
  }
  return password;
}

function readEmail(body, errors) {
  const email = readString(body, 'email', errors, {
    label: 'Email',
    max: 254,
    pattern: EMAIL_PATTERN,
    patternMessage: 'Email must be a valid email address',
  });
  return email === undefined ? undefined : email.toLowerCase();
}

// POST /api/auth/register   body: { name, email, password }
export async function register(req, res) {
  const errors = new FieldErrors();
  const name = readString(req.body, 'name', errors, { label: 'Name', min: 2, max: 60 });
  const email = readEmail(req.body, errors);
  const password = readNewPassword(req.body, errors);
  errors.throwIfAny();

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (error) {
    // The unique email index (not a "check first, then insert") is what really prevents
    // duplicates, even if two people register the same email at the same moment.
    if (error.code === 11000) {
      throw ApiError.conflict('An account with this email already exists');
    }
    throw error;
  }

  res.status(201).json({ token: signToken(user._id), user });
}

// POST /api/auth/login   body: { email, password }
export async function login(req, res) {
  const errors = new FieldErrors();
  const email = readEmail(req.body, errors);
  const password = req.body.password;
  if (typeof password !== 'string' || password === '') {
    errors.add('password', 'Password is required');
  }
  errors.throwIfAny();

  // passwordHash is hidden by default (select: false), so ask for it explicitly. Only here.
  const user = await User.findOne({ email }).select('+passwordHash');
  const isValid = await verifyPassword(password, user ? user.passwordHash : null);

  if (!isValid) {
    // Same message whether the email or the password was wrong.
    throw ApiError.unauthorized('Invalid email or password');
  }

  res.status(200).json({ token: signToken(user._id), user });
}

// GET /api/auth/me   (the authenticate middleware has already loaded req.user)
export function getCurrentUser(req, res) {
  res.status(200).json({ user: req.user });
}
