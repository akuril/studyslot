import mongoose from 'mongoose';
import { FIRST_NAME_PATTERN, MIN_GRADE, MAX_GRADE } from './Booking.js';

// A parent's saved student, so they don't retype the first name and grade for every
// booking. Same rules as a booking's student fields. First name only: no last names,
// birthdays, or schools are ever stored.
export const MAX_STUDENTS_PER_PARENT = 10;

const studentSchema = new mongoose.Schema(
  {
    // Owner. Always set by the server from the verified login token.
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Parent is required'],
      immutable: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [40, 'First name must be at most 40 characters'],
      match: [
        FIRST_NAME_PATTERN,
        'First name can only contain letters, spaces, hyphens, and apostrophes',
      ],
    },
    // Lowercase copy, so "Sam" and "sam" count as the same student for one parent.
    firstNameKey: {
      type: String,
      required: true,
      select: false,
    },
    grade: {
      type: Number,
      required: [true, 'Grade is required'],
      min: [MIN_GRADE, `Grade must be between ${MIN_GRADE} and ${MAX_GRADE}`],
      max: [MAX_GRADE, `Grade must be between ${MIN_GRADE} and ${MAX_GRADE}`],
      validate: { validator: Number.isInteger, message: 'Grade must be a whole number' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.parent; // always the requester
        delete ret.firstNameKey;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

studentSchema.pre('validate', function setFirstNameKey() {
  if (typeof this.firstName === 'string') {
    this.firstNameKey = this.firstName.trim().toLowerCase();
  }
});

// One parent can't save two students with the same first name (enforced by MongoDB).
studentSchema.index({ parent: 1, firstNameKey: 1 }, { unique: true });

export const Student = mongoose.model('Student', studentSchema);
