import { useState } from 'react';
import { ASSIGNMENT_TYPES } from '../utils/assignments';
import { daysFromToday, daysUntil, formatDueDate, todayString } from '../utils/dates';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', buttonClass: 'btn-outline-success' },
  { value: 'medium', label: 'Medium', buttonClass: 'btn-outline-secondary' },
  { value: 'high', label: '🔥 High', buttonClass: 'btn-outline-danger' },
];

const TITLE_MAX = 80;
const NOTES_MAX = 300;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Starting values: the assignment's data when editing, sensible defaults when adding.
function getInitialFormData(initialAssignment, classes, defaultClassId) {
  if (initialAssignment) {
    return {
      title: initialAssignment.title,
      classId: initialAssignment.classId,
      type: initialAssignment.type,
      dueDate: initialAssignment.dueDate,
      priority: initialAssignment.priority,
      notes: initialAssignment.notes || '',
    };
  }

  return {
    title: '',
    classId: defaultClassId || (classes.length === 1 ? classes[0].id : ''),
    type: 'homework',
    dueDate: daysFromToday(1),
    priority: 'medium',
    notes: '',
  };
}

function AssignmentForm({ initialAssignment, classes, defaultClassId, onSave, onCancel }) {
  const isEditing = initialAssignment !== null;

  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialAssignment, classes, defaultClassId)
  );
  const [errors, setErrors] = useState({});

  const hasValidDate = DATE_PATTERN.test(formData.dueDate);
  const isPastDate = hasValidDate && daysUntil(formData.dueDate) < 0;

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function setDueDate(dateString) {
    setFormData((current) => ({ ...current, dueDate: dateString }));
    setErrors((current) => ({ ...current, dueDate: '' }));
  }

  function validate() {
    const newErrors = {};
    const trimmedTitle = formData.title.trim();

    if (trimmedTitle === '') {
      newErrors.title = "Oops! What's the assignment? Type a short title.";
    } else if (trimmedTitle.length > TITLE_MAX) {
      newErrors.title = `Try to keep the title under ${TITLE_MAX} characters.`;
    }

    const classExists = classes.some((classItem) => classItem.id === formData.classId);
    if (!classExists) {
      newErrors.classId = 'Pick which class this is for.';
    }

    if (!DATE_PATTERN.test(formData.dueDate)) {
      newErrors.dueDate = 'Choose the date this is due.';
    }

    if (formData.notes.length > NOTES_MAX) {
      newErrors.notes = `Notes can be up to ${NOTES_MAX} characters.`;
    }

    return newErrors;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    onSave({
      title: formData.title.trim(),
      classId: formData.classId,
      type: formData.type,
      dueDate: formData.dueDate,
      priority: formData.priority,
      notes: formData.notes.trim(),
    });
  }

  return (
    <form className="card border-0 shadow-sm" onSubmit={handleSubmit} noValidate>
      <div className="card-body p-4 d-flex flex-column gap-4">
        {/* Title */}
        <div>
          <label htmlFor="assignment-title" className="form-label fw-semibold">
            What's the assignment? <span className="text-danger">*</span>
          </label>
          <input
            id="assignment-title"
            name="title"
            type="text"
            className={`form-control form-control-lg ${errors.title ? 'is-invalid' : ''}`}
            placeholder="e.g. Chapter 5 worksheet"
            value={formData.title}
            onChange={handleChange}
            autoFocus={!isEditing}
          />
          {errors.title && <div className="invalid-feedback">{errors.title}</div>}
        </div>

        {/* Class */}
        <div>
          <label htmlFor="assignment-class" className="form-label fw-semibold">
            Which class? <span className="text-danger">*</span>
          </label>
          <select
            id="assignment-class"
            name="classId"
            className={`form-select form-select-lg ${errors.classId ? 'is-invalid' : ''}`}
            value={formData.classId}
            onChange={handleChange}
          >
            <option value="">Choose a class…</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>
          {errors.classId && <div className="invalid-feedback">{errors.classId}</div>}
        </div>

        {/* Type */}
        <fieldset>
          <legend className="form-label fw-semibold fs-6">What kind is it?</legend>
          <div className="d-flex flex-wrap gap-2">
            {Object.entries(ASSIGNMENT_TYPES).map(([typeKey, typeInfo]) => (
              <div key={typeKey}>
                <input
                  type="radio"
                  className="btn-check"
                  id={`type-${typeKey}`}
                  name="type"
                  value={typeKey}
                  checked={formData.type === typeKey}
                  onChange={handleChange}
                />
                <label className="btn btn-outline-primary py-2 px-3" htmlFor={`type-${typeKey}`}>
                  {typeInfo.icon} {typeInfo.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Due date */}
        <div>
          <label htmlFor="assignment-due" className="form-label fw-semibold">
            When is it due? <span className="text-danger">*</span>
          </label>
          <input
            id="assignment-due"
            name="dueDate"
            type="date"
            className={`form-control form-control-lg ${errors.dueDate ? 'is-invalid' : ''}`}
            value={formData.dueDate}
            onChange={handleChange}
          />
          {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}

          <div className="d-flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDueDate(todayString())}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDueDate(daysFromToday(1))}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setDueDate(daysFromToday(7))}
            >
              In a week
            </button>
          </div>

          {hasValidDate && (
            <div className="form-text">📅 Due {formatDueDate(formData.dueDate)}</div>
          )}
          {isPastDate && (
            <div className="form-text text-warning-emphasis">
              ⚠️ This date has already passed. That's okay if you're adding late work.
            </div>
          )}
        </div>

        {/* Priority */}
        <fieldset>
          <legend className="form-label fw-semibold fs-6">How important is it?</legend>
          <div className="d-flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((option) => (
              <div key={option.value}>
                <input
                  type="radio"
                  className="btn-check"
                  id={`priority-${option.value}`}
                  name="priority"
                  value={option.value}
                  checked={formData.priority === option.value}
                  onChange={handleChange}
                />
                <label
                  className={`btn ${option.buttonClass} py-2 px-3`}
                  htmlFor={`priority-${option.value}`}
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Notes */}
        <div>
          <label htmlFor="assignment-notes" className="form-label fw-semibold">
            Notes <span className="text-secondary fw-normal">(optional)</span>
          </label>
          <textarea
            id="assignment-notes"
            name="notes"
            rows="3"
            className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
            placeholder="e.g. Pages 40–45, show your work"
            value={formData.notes}
            onChange={handleChange}
          ></textarea>
          {errors.notes ? (
            <div className="invalid-feedback">{errors.notes}</div>
          ) : (
            <div
              className={`form-text text-end ${
                formData.notes.length > NOTES_MAX ? 'text-danger' : ''
              }`}
            >
              {formData.notes.length}/{NOTES_MAX}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="d-flex flex-column flex-sm-row gap-2">
          <button type="submit" className="btn btn-primary btn-lg">
            {isEditing ? 'Save Changes' : 'Add Assignment'}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-lg" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default AssignmentForm;