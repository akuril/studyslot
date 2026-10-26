import { useState } from 'react';
import FormField from './FormField';
import { changePassword } from '../api/auth';
import { validateChangePassword } from '../utils/accountValidation';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Change the password: needs the current one first. You stay logged in on this device. */
function ChangePasswordForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setIsSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;

    const clientErrors = validateChangePassword(form);
    setErrors(clientErrors);
    setServerError('');
    setIsSaved(false);
    if (Object.keys(clientErrors).length > 0) return;

    setIsSaving(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(EMPTY); // never keep passwords in the form after use
      setIsSaved(true);
    } catch (error) {
      const fieldErrors = error.fieldErrors || {};
      setErrors(fieldErrors);
      setServerError(Object.keys(fieldErrors).length ? '' : error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {isSaved && (
        <div className="alert alert-success" role="status">
          Your password was updated.
        </div>
      )}
      {serverError && (
        <div className="alert alert-danger" role="alert">
          {serverError}
        </div>
      )}

      <FormField
        id="current-password"
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={form.currentPassword}
        onChange={(event) => setField('currentPassword', event.target.value)}
        error={errors.currentPassword}
        required
      />
      <FormField
        id="new-password"
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={form.newPassword}
        onChange={(event) => setField('newPassword', event.target.value)}
        error={errors.newPassword}
        hint="At least 8 characters, with a letter and a number."
        required
      />
      <FormField
        id="confirm-new-password"
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={(event) => setField('confirmPassword', event.target.value)}
        error={errors.confirmPassword}
        required
      />

      <button type="submit" className="btn btn-primary" disabled={isSaving}>
        {isSaving ? 'Updating…' : 'Update password'}
      </button>
    </form>
  );
}

export default ChangePasswordForm;
