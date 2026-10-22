import { Student, MAX_STUDENTS_PER_PARENT } from '../models/Student.js';
import { FIRST_NAME_PATTERN, MIN_GRADE, MAX_GRADE } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { FieldErrors, readString, readInteger } from '../utils/validation.js';

const DUPLICATE_MESSAGE = 'You already saved a student with this first name';

function readFirstName(body, errors, required) {
  return readString(body, 'firstName', errors, {
    label: 'First name',
    required,
    max: 40,
    pattern: FIRST_NAME_PATTERN,
    patternMessage: 'First name can only contain letters, spaces, hyphens, and apostrophes',
  });
}

function readGrade(body, errors, required) {
  return readInteger(body, 'grade', errors, {
    label: 'Grade',
    required,
    min: MIN_GRADE,
    max: MAX_GRADE,
  });
}

/** Loads a student that belongs to this parent: 404 if missing, 403 if someone else's. */
async function findOwnedStudent(id, parent) {
  const student = await Student.findById(id);
  if (!student) {
    throw ApiError.notFound('Student not found');
  }
  if (!student.parent.equals(parent._id)) {
    throw ApiError.forbidden('You do not have access to this student');
  }
  return student;
}

async function saveOrConflict(student) {
  try {
    await student.save();
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.conflict(DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

// GET /api/students   -> the parent's saved students, A-Z
export async function listStudents(req, res) {
  const students = await Student.find({ parent: req.user._id }).sort({ firstName: 1 });
  res.status(200).json(students);
}

// POST /api/students   body: { firstName, grade }
export async function createStudent(req, res) {
  const errors = new FieldErrors();
  const firstName = readFirstName(req.body, errors, true);
  const grade = readGrade(req.body, errors, true);
  errors.throwIfAny();

  const count = await Student.countDocuments({ parent: req.user._id });
  if (count >= MAX_STUDENTS_PER_PARENT) {
    throw ApiError.conflict(`You can save up to ${MAX_STUDENTS_PER_PARENT} students`);
  }

  const student = new Student({ parent: req.user._id, firstName, grade });
  await saveOrConflict(student);
  res.status(201).json(student);
}

// PATCH /api/students/:id   body: { firstName?, grade? }
export async function updateStudent(req, res) {
  if (req.body.firstName === undefined && req.body.grade === undefined) {
    throw ApiError.badRequest('Provide firstName and/or grade to update');
  }
  const errors = new FieldErrors();
  const firstName = readFirstName(req.body, errors, false);
  const grade = readGrade(req.body, errors, false);
  errors.throwIfAny();

  const student = await findOwnedStudent(req.params.id, req.user);
  if (firstName !== undefined) student.firstName = firstName;
  if (grade !== undefined) student.grade = grade;
  await saveOrConflict(student);
  res.status(200).json(student);
}

// DELETE /api/students/:id   -> 204. Past bookings keep their own copy of the name and grade.
export async function deleteStudent(req, res) {
  const student = await findOwnedStudent(req.params.id, req.user);
  await student.deleteOne();
  res.status(204).end();
}
