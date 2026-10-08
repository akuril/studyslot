import { useState } from 'react';

const colorOptions = [
  { value: '#0d6efd', label: 'Blue' },
  { value: '#198754', label: 'Green' },
  { value: '#dc3545', label: 'Red' },
  { value: '#fd7e14', label: 'Orange' },
  { value: '#6f42c1', label: 'Purple' },
  { value: '#d63384', label: 'Pink' },
  { value: '#20c997', label: 'Teal' },
  { value: '#6c757d', label: 'Gray' },
];

function ClassForm({ initialClass, takenNames, onSave, onCancel }) {
  const isEditing = initialClass !== null;

  const [name, setName] = useState(isEditing ? initialClass.name : '');
  const [teacher, setTeacher] = useState(isEditing ? initialClass.teacher : '');
  const [color, setColor] = useState(isEditing ? initialClass.color : colorOptions[0].value);
  const [errors, setErrors] = useState({});

  function validate() {
    const newErrors = {};
    const trimmedName = name.trim();

    if (trimmedName === '') {
      newErrors.name = 'Oops! Please type the name of your class.';
    } else if (trimmedName.length > 40) {
      newErrors.name = 'That name is a little long. Try 40 characters or fewer.';
    } else if (takenNames.includes(trimmedName.toLowerCase())) {
      newErrors.name = 'You already have a class with that name.';
    }

    if (teacher.trim().length > 40) {
      newErrors.teacher = 'Teacher name should be 40 characters or fewer.';
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
      name: name.trim(),
      teacher: teacher.trim(),
      color: color,
    });
  }

  function handleNameChange(event) {
    setName(event.target.value);
    setErrors({ ...errors, name: '' });
  }

  function handleTeacherChange(event) {
    setTeacher(event.target.value);
    setErrors({ ...errors, teacher: '' });
  }

  return (
    <form className="card border-0 shadow-sm mb-4" onSubmit={handleSubmit} noValidate>
      <div className="card-body p-4">
        <h2 className="h5 fw-bold mb-3">
          {isEditing ? `Edit ${initialClass.name}` : 'Add a new class'}
        </h2>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="class-name" className="form-label fw-semibold">
              What's the class called? <span className="text-danger">*</span>
            </label>
            <input
              id="class-name"
              type="text"
              className={`form-control form-control-lg ${errors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Science 7"
              value={name}
              onChange={handleNameChange}
              autoFocus
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="class-teacher" className="form-label fw-semibold">
              Who's the teacher? <span className="text-secondary fw-normal">(optional)</span>
            </label>
            <input
              id="class-teacher"
              type="text"
              className={`form-control form-control-lg ${errors.teacher ? 'is-invalid' : ''}`}
              placeholder="e.g. Ms. Rivera"
              value={teacher}
              onChange={handleTeacherChange}
            />
            {errors.teacher && <div className="invalid-feedback">{errors.teacher}</div>}
          </div>

          <div className="col-12">
            <fieldset>
              <legend className="form-label fw-semibold fs-6">Pick a color</legend>
              <div className="d-flex flex-wrap gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`color-swatch ${color === option.value ? 'selected' : ''}`}
                    style={{ backgroundColor: option.value }}
                    onClick={() => setColor(option.value)}
                    aria-label={option.label}
                    aria-pressed={color === option.value}
                    title={option.label}
                  >
                    {color === option.value && '✓'}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-2 mt-4">
          <button type="submit" className="btn btn-primary btn-lg">
            {isEditing ? 'Save Changes' : 'Add Class'}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-lg" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export default ClassForm;