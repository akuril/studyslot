import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { Student } from '../models/Student.js';
import { FieldErrors, readString } from '../utils/validation.js';
import { hashPassword, verifyPassword } from '../services/authService.js';
import { readNewPassword } from './authController.js';

export const BIO_MAX = 300;

// PATCH /api/auth/me   body: { name?, bio? }
// Changes ONLY the logged-in user's own profile. The user comes from the verified token,
// so nobody can edit anyone else's. Email and role can never be changed here.
export async function updateProfile(req, res) {
  const errors = new FieldErrors();
  const user = req.user;
  const isTutor = user.role === 'tutor';
  const body = req.body;

  if (Object.keys(body).length === 0) {
    errors.add('name', 'Send at least one field to change');
  }

  const name = 'name' in body ? readString(body, 'name', errors, { label: 'Name', min: 2, max: 60 }) : undefined;

  let bio;
  if ('bio' in body) {
    if (!isTutor) {
      errors.add('bio', 'Only tutors can add a bio');
    } else if (typeof body.bio !== 'string') {
      errors.add('bio', 'Bio must be text');
    } else if (body.bio.trim().length > BIO_MAX) {
      errors.add('bio', `Bio must be at most ${BIO_MAX} characters`);
    } else {
      bio = body.bio.trim(); // an empty bio is allowed: it clears it
    }
  }
  errors.throwIfAny();

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  await user.save();

  res.status(200).json({ user });
}

// POST /api/auth/change-password   body: { currentPassword, newPassword }
// A wrong current password is a 400 with a field message, NOT a 401: the browser treats
// any 401 as "your session expired" and would log the person out.
export async function changePassword(req, res) {
  const errors = new FieldErrors();
  const { currentPassword } = req.body;
  if (typeof currentPassword !== 'string' || currentPassword === '') {
    errors.add('currentPassword', 'Current password is required');
  }
  const newPassword = readNewPassword(req.body, errors, 'newPassword');
  errors.throwIfAny();

  const account = await User.findById(req.user._id).select('+passwordHash');
  const isCurrentCorrect = await verifyPassword(currentPassword, account ? account.passwordHash : null);
  if (!isCurrentCorrect) {
    errors.add('currentPassword', 'Current password is incorrect');
    errors.throwIfAny();
  }
  if (newPassword === currentPassword) {
    errors.add('newPassword', 'Choose a password different from your current one');
    errors.throwIfAny();
  }

  account.passwordHash = await hashPassword(newPassword);
  await account.save();

  res.status(200).json({ message: 'Password updated' });
}

// How a booking counts for the account page. The same rule the dashboards use:
//  - cancelled: status "cancelled"
//  - completed: marked by the tutor, or its end time has passed
//  - upcoming:  confirmed and not over yet
export function countBookings(bookings, now = new Date()) {
  const counts = { upcoming: 0, completed: 0, cancelled: 0 };
  for (const booking of bookings) {
    if (booking.status === 'cancelled') {
      counts.cancelled += 1;
    } else if (booking.completedAt || booking.endTime <= now) {
      counts.completed += 1;
    } else {
      counts.upcoming += 1;
    }
  }
  return counts;
}

// GET /api/auth/me/summary
// Numbers for the account page. Parents get their booking counts and how many students
// they saved. Tutors get their session counts, how many sessions still need to be
// marked completed, and the services linked to their account.
export async function getAccountSummary(req, res) {
  const user = req.user;
  const now = new Date();

  if (user.role === 'tutor') {
    const services = await Service.find({ tutor: user._id }).sort({ name: 1 });
    const bookings = await Booking.find({ service: { $in: services.map((s) => s._id) } }).select(
      'status startTime endTime completedAt',
    );
    const counts = countBookings(bookings, now);
    const needsCompleting = bookings.filter(
      (b) => b.status === 'confirmed' && !b.completedAt && b.startTime <= now,
    ).length;

    return res.status(200).json({
      role: 'tutor',
      bookings: { ...counts, needsCompleting },
      services: services.map((service) => ({
        id: String(service._id),
        name: service.name,
        subject: service.subject,
        gradeBand: service.gradeBand,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        isActive: service.isActive,
      })),
    });
  }

  const bookings = await Booking.find({ user: user._id }).select(
    'status startTime endTime completedAt',
  );
  const studentCount = await Student.countDocuments({ parent: user._id });
  return res.status(200).json({
    role: 'parent',
    bookings: countBookings(bookings, now),
    students: studentCount,
  });
}
