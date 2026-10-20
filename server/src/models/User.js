import mongoose from 'mongoose';

// A simple, practical email check: something@something.something with no spaces.
// The API layer (Step 17) validates first; this is the safety net.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // never loaded unless a query explicitly asks for it
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
        delete ret.passwordHash; // extra protection if it was ever selected
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

export const User = mongoose.model('User', userSchema);
