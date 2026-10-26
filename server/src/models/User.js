import mongoose from 'mongoose';

// A simple, practical email check: something@something.something with no spaces.
// The API layer (Step 17) validates first; this is the safety net.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Two kinds of accounts:
//  - parent: books sessions for their students (everyone who registers)
//  - tutor:  sees and completes the sessions for services they teach.
//            Tutor accounts are only created by `npm run seed:tutors`, never by sign-up.
export const USER_ROLES = ['parent', 'tutor'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true, // "Jordan@Example.COM" is stored as "jordan@example.com"
      maxlength: [254, 'Email must be at most 254 characters'],
      match: [EMAIL_PATTERN, 'Email must be a valid email address'],
      unique: true, // creates a unique INDEX (enforced by MongoDB, not by validation)
    },
    role: {
      type: String,
      enum: { values: USER_ROLES, message: 'Role "{VALUE}" is not supported' },
      default: 'parent',
      immutable: true, // an account can never change its own role
      // Accounts created before roles existed have no role saved: they are parents.
      get: (value) => value || 'parent',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never loaded unless a query explicitly asks for it
    },
    // A short introduction a tutor writes on their account page. Parents never have one.
    bio: {
      type: String,
      trim: true,
      maxlength: [300, 'Bio must be at most 300 characters'],
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      // Controls what res.json(user) sends to the client.
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        ret.role = doc.role; // through the getter, so older accounts show "parent"
        delete ret.passwordHash; // extra protection if it was ever selected
        if (doc.role !== 'tutor') {
          delete ret.bio; // only tutors have a bio
        }
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

export const User = mongoose.model('User', userSchema);
