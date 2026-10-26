import { useState } from 'react';
import FormField from './FormField';
import { updateProfile } from '../api/auth';
import {
  BIO_MAX,
  isProfileUnchanged,
  validateProfile,
} from '../utils/accountValidation';

/**
 * Edit the name (everyone) and the short bio (tutors). Email and role can't be changed.
 * Calls onSaved(updatedUser) after the server confirms, and onCancel() to close the form.
 */
function ProfileForm({ user, tutor, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: user.name, bio: user.bio || '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;

    const clientErrors = validateProfile(form, { tutor });
    setErrors(clientErrors);
    setServerError('');
    if (Object.keys(clientErrors).length > 0) return;

    if (isProfileUnchanged(form, user, { tutor })) {
      onCancel(); // nothing to save
      return;
    }

    setIsSaving(true);
    try {
      // Only fields the API accepts. A parent's form never sends a bio.
      const changes = { name: form.name.trim() };
      if (tutor) changes.bio = form.bio.trim();
      const { user: updated } = await updateProfile(changes);
      onSaved(updated);
    } catch (error) {
      const fieldErrors = error.fieldErrors || {};
      setErrors(fieldErrors);
      setServerError(Object.keys(fieldErrors).length ? '' : error.message);
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert alert-danger" role="alert">
          {serverError}
        </div>
      )}

      <FormField
        id="profile-name"
        label="Name"
        name="name"
        autoComplete="name"
        maxLength={60}
        value={form.name}
        onChange={(event) => setField('name', event.target.value)}
        error={errors.name}
        required
      />

      {tutor && (
        <div className="mb-3">
          <label htmlFor="profile-bio" className="form-label fw-semibold">
            Bio <span className="fw-normal text-secondary">(optional)</span>
          </label>
          <textarea
            id="profile-bio"
            className={`form-control ${errors.bio ? 'is-invalid' : ''}`}
            rows={4}
            maxLength={BIO_MAX}
            value={form.bio}
            onChange={(event) => setField('bio', event.target.value)}
            aria-describedby="profile-bio-count"
            placeholder="A sentence or two about how you teach."
          />
          <div id="profile-bio-count" className="form-text">
            {form.bio.length}/{BIO_MAX} characters
          </div>
          {errors.bio && <div className="invalid-feedback d-block">{errors.bio}</div>}
        </div>
      )}

      <p className="small text-secondary">
        Your email and account type can&apos;t be changed here.
      </p>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default ProfileForm;
