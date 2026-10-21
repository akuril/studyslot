import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['confirmed', 'cancelled'];
export const MIN_GRADE = 6;
export const MAX_GRADE = 12;

// Letters (including accented ones like "José"), spaces, hyphens, and apostrophes.
// Must start with a letter.
export const FIRST_NAME_PATTERN = /^\p{L}[\p{L} '-]*$/u;

// A copy of the service's details at the moment of booking, so a booking's
// history never changes if the service is later renamed or repriced.
// `_id: false` because this is part of the booking, not its own document.
const serviceSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    tutorName: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    priceCents: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const bookingSchema = new mongoose.Schema(
  {
    // Owner. Always set by the server from the verified login token, never from the request body.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: [true, 'Service snapshot is required'],
    },
    studentFirstName: {
      type: String,
      required: [true, 'Student first name is required'],
      trim: true,
      maxlength: [40, 'Student first name must be at most 40 characters'],
      match: [
        FIRST_NAME_PATTERN,
        'Student first name can only contain letters, spaces, hyphens, and apostrophes',
      ],
    },
    studentGrade: {
      type: Number,
      required: [true, 'Student grade is required'],
      min: [MIN_GRADE, `Grade must be between ${MIN_GRADE} and ${MAX_GRADE}`],
      max: [MAX_GRADE, `Grade must be between ${MIN_GRADE} and ${MAX_GRADE}`],
      validate: { validator: Number.isInteger, message: 'Grade must be a whole number' },
    },
    // Stored in UTC (MongoDB Dates always are). Business-hour rules are checked in Step 19.
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    // The first time ever booked. Set automatically on creation and never changed.
    originalStartTime: {
      type: Date,
      immutable: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes must be at most 300 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: { values: BOOKING_STATUSES, message: 'Status "{VALUE}" is not supported' },
      default: 'confirmed',
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Reschedule count must be a whole number' },
    },
    lastRescheduledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        // Works whether `service` is a plain id or a populated document.
        ret.serviceId = String(ret.service && ret.service._id ? ret.service._id : ret.service);
        delete ret._id;
        delete ret.__v;
        delete ret.service;
        delete ret.user; // the requester always owns the booking, so it adds nothing
        return ret;
      },
    },
  },
);

// Small, justified model behavior: fill originalStartTime once, when the booking is created.
bookingSchema.pre('validate', function setOriginalStartTime() {
  if (this.isNew && !this.originalStartTime && this.startTime) {
    this.originalStartTime = this.startTime;
  }
});

// Structural rules that must ALWAYS hold, no matter which code path saves a booking.
bookingSchema.path('endTime').validate(function endsAfterStart(endTime) {
  return !this.startTime || !endTime || endTime > this.startTime;
}, 'End time must be after start time');

bookingSchema.path('cancelledAt').validate(function cancelledAtMatchesStatus(cancelledAt) {
  return this.status === 'cancelled' ? cancelledAt instanceof Date : cancelledAt === null;
}, 'Cancelled time must be set only on cancelled bookings');

// Dashboard:      find({ user }).sort({ startTime: 1 })
bookingSchema.index({ user: 1, startTime: 1 });
// Overlap check:  find({ service, status: 'confirmed', startTime: { $lt: newEnd }, endTime: { $gt: newStart } })
bookingSchema.index({ service: 1, status: 1, startTime: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
