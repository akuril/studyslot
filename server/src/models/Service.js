import mongoose from 'mongoose';

// Allowed values. Exported so the API validation (Step 15+) and the seed script
// use exactly the same lists as the schema.
export const SERVICE_SUBJECTS = [
  'math',
  'science',
  'english',
  'social-studies',
  'world-languages',
  'computer-science',
  'study-skills',
  'test-prep',
  'homework-help',
];
export const GRADE_BANDS = ['6-8', '9-12', '6-12'];
export const SERVICE_DURATIONS = [30, 45, 60, 90];

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
      unique: true, // lets the seed script safely update services by name
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      enum: { values: SERVICE_SUBJECTS, message: 'Subject "{VALUE}" is not supported' },
    },
    gradeBand: {
      type: String,
      required: [true, 'Grade band is required'],
      enum: { values: GRADE_BANDS, message: 'Grade band "{VALUE}" is not supported' },
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
      trim: true,
      maxlength: [160, 'Summary must be at most 160 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },
    tutorName: {
      type: String,
      required: [true, 'Tutor name is required'],
      trim: true,
      maxlength: [60, 'Tutor name must be at most 60 characters'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      enum: { values: SERVICE_DURATIONS, message: 'Duration {VALUE} is not supported' },
    },
    priceCents: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be a whole number of cents',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.isActive; // the API only ever returns active services
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

// Supports GET /api/services?subject=&gradeBand=  ->  find({ isActive: true, subject, gradeBand })
serviceSchema.index({ isActive: 1, subject: 1, gradeBand: 1 });

export const Service = mongoose.model('Service', serviceSchema);
