import { useState } from 'react';
import Avatar from './Avatar';
import { createStudent, deleteStudent, updateStudent } from '../api/students';
import { GRADES } from '../utils/services';
import { MAX_STUDENTS, validateStudent } from '../utils/students';

function StudentForm({ initial, submitLabel, onSubmit, onCancel, idPrefix }) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    const found = validateStudent(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      await onSubmit({ firstName: form.firstName.trim(), grade: Number(form.grade) });
    } catch (error) {
      setErrors({ ...error.fieldErrors, form: error.fieldErrors.firstName ? '' : error.message });
      setIsSaving(false);
    }
  }

  return (
    <form className="row g-2 align-items-start" onSubmit={handleSubmit} noValidate>
      <div className="col-12 col-sm-6">
        <label htmlFor={`${idPrefix}-name`} className="visually-hidden">
          Student&apos;s first name
        </label>
        <input
          id={`${idPrefix}-name`}
          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
          placeholder="First name"
          maxLength={40}
          autoComplete="off"
          value={form.firstName}
          onChange={(event) => setForm({ ...form, firstName: event.target.value })}
        />
        {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
      </div>
      <div className="col-7 col-sm-3">
        <label htmlFor={`${idPrefix}-grade`} className="visually-hidden">
          Grade
        </label>
        <select
          id={`${idPrefix}-grade`}
          className={`form-select ${errors.grade ? 'is-invalid' : ''}`}
          value={form.grade}
          onChange={(event) => setForm({ ...form, grade: event.target.value })}
        >
          <option value="">Grade</option>
          {GRADES.map((grade) => (
            <option key={grade} value={grade}>
              Grade {grade}
            </option>
          ))}
        </select>
        {errors.grade && <div className="invalid-feedback">{errors.grade}</div>}
      </div>
      <div className="col-5 col-sm-3 d-flex gap-1">
        <button type="submit" className="btn btn-primary flex-grow-1" disabled={isSaving}>
          {isSaving ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            aria-label="Cancel"
          >
            ✕
          </button>
        )}
      </div>
      {errors.form && (
        <div className="col-12">
          <div className="alert alert-danger py-2 mb-0" role="alert">
            {errors.form}
          </div>
        </div>
      )}
    </form>
  );
}

/**
 * The parent's saved students: list, add, edit, remove.
 * `students` comes from the dashboard; `onChange(nextList)` updates it after each change.
 */
function StudentsPanel({ students, onChange }) {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const sorted = [...students].sort((a, b) => a.firstName.localeCompare(b.firstName));
  const isFull = students.length >= MAX_STUDENTS;

  async function handleAdd(values) {
    const student = await createStudent(values);
    onChange([...students, student]);
    setIsAdding(false);
    setMessage(`${student.firstName} was saved.`);
  }

  async function handleEdit(id, values) {
    const student = await updateStudent(id, values);
    onChange(students.map((item) => (item.id === id ? student : item)));
    setEditingId(null);
    setMessage(`${student.firstName} was updated.`);
  }

  async function handleDelete(student) {
    setError('');
    try {
      await deleteStudent(student.id);
      onChange(students.filter((item) => item.id !== student.id));
      setConfirmingId(null);
      setMessage(`${student.firstName} was removed. Past bookings are not affected.`);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="card border-0 shadow-sm h-100" aria-labelledby="students-title">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          <h2 id="students-title" className="h5 fw-bold mb-0">
            My students
          </h2>
          {!isAdding && !isFull && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setMessage('');
              }}
            >
              + Add student
            </button>
          )}
        </div>
        <p className="small text-secondary">
          Save each student once, then pick them when booking. First names only.
        </p>

        <div aria-live="polite">
          {message && <p className="small text-success fw-semibold">{message}</p>}
          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}
        </div>

        {isAdding && (
          <div className="mb-3">
            <StudentForm
              idPrefix="new-student"
              initial={{ firstName: '', grade: '' }}
              submitLabel="Save"
              onSubmit={handleAdd}
              onCancel={() => setIsAdding(false)}
            />
          </div>
        )}

        {sorted.length === 0 && !isAdding ? (
          <p className="text-secondary mb-0">No saved students yet.</p>
        ) : (
          <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
            {sorted.map((student) => (
              <li key={student.id} className="border rounded-3 p-2">
                {editingId === student.id ? (
                  <StudentForm
                    idPrefix={`edit-${student.id}`}
                    initial={{ firstName: student.firstName, grade: String(student.grade) }}
                    submitLabel="Save"
                    onSubmit={(values) => handleEdit(student.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <Avatar name={student.firstName} size="sm" />
                    <div className="flex-grow-1 min-w-0">
                      <span className="fw-semibold">{student.firstName}</span>{' '}
                      <span className="text-secondary small">· Grade {student.grade}</span>
                    </div>
                    {confirmingId === student.id ? (
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(student)}
                        >
                          Remove {student.firstName}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setConfirmingId(null)}
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setEditingId(student.id);
                            setIsAdding(false);
                            setMessage('');
                          }}
                        >
                          Edit<span className="visually-hidden"> {student.firstName}</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setConfirmingId(student.id)}
                        >
                          Remove<span className="visually-hidden"> {student.firstName}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {isFull && (
          <p className="small text-secondary mt-2 mb-0">
            You&apos;ve saved the maximum of {MAX_STUDENTS} students.
          </p>
        )}
      </div>
    </section>
  );
}

export default StudentsPanel;
