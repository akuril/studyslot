import { Service, SERVICE_SUBJECTS } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { FieldErrors, readInteger } from '../utils/validation.js';

// Which grade bands include a given grade. A 7th grader fits "6-8" AND "6-12" services.
function gradeBandsForGrade(grade) {
  return grade <= 8 ? ['6-8', '6-12'] : ['9-12', '6-12'];
}

// Builds a SAFE MongoDB filter from the query string. Only approved fields with
// approved values ever reach the database; anything else is a 400.
function buildServiceFilter(query) {
  const errors = new FieldErrors();
  const filter = { isActive: true }; // the catalog never shows inactive services

  if (query.subject !== undefined) {
    // typeof check blocks tricks like ?subject[$ne]=x or ?subject=a&subject=b (arrays/objects)
    if (typeof query.subject !== 'string' || !SERVICE_SUBJECTS.includes(query.subject)) {
      errors.add('subject', `Subject must be one of: ${SERVICE_SUBJECTS.join(', ')}`);
    } else {
      filter.subject = query.subject;
    }
  }

  if (query.grade !== undefined) {
    if (typeof query.grade !== 'string') {
      errors.add('grade', 'Grade must be a whole number');
    } else {
      const grade = readInteger(query, 'grade', errors, { label: 'Grade', min: 6, max: 12 });
      if (grade !== undefined) {
        filter.gradeBand = { $in: gradeBandsForGrade(grade) };
      }
    }
  }

  errors.throwIfAny();
  return filter;
}

// GET /api/services?subject=&grade=
export async function listServices(req, res) {
  const filter = buildServiceFilter(req.query);
  const services = await Service.find(filter).sort({ subject: 1, name: 1 });
  res.status(200).json(services);
}

// GET /api/services/:id   (the id format is already checked by validateIdParam)
export async function getService(req, res) {
  const service = await Service.findOne({ _id: req.params.id, isActive: true });
  if (!service) {
    throw ApiError.notFound('Service not found');
  }
  res.status(200).json(service);
}
