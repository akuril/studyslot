import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { validateRegistration } from '../utils/authValidation';

function getReturnPath(location) {
  const from = location.state && location.state.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : '/account';
}

function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getReturnPath(location);

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (user && !isSubmitting) {
    return <Navigate to={returnPath} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const clientErrors = validateRegistration(form);
    setErrors(clientErrors);
    setServerError('');
    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // confirmPassword is only for this form; the API never receives it.
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(returnPath, { replace: true });
    } catch (error) {
      const fieldErrors = error.fieldErrors || {};
      // A duplicate email (409) has no field details; show it next to the email box.
      if (error.status === 409) {
        fieldErrors.email = error.message;
      }
      setErrors(fieldErrors);
      setServerError(error.status === 409 ? '' : error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-8 col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h1 className="h3 fw-bold mb-1">Create a parent account</h1>
            <p className="text-secondary">
              For parents and guardians. You&apos;ll add your student&apos;s first name and grade
              when you book.
            </p>

            {serverError && (
              <div className="alert alert-danger" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                id="register-name"
                label="Your name"
                name="name"
                autoComplete="name"
                maxLength={60}
                value={form.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <FormField
                id="register-email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
              <FormField
                id="register-password"
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                hint="At least 8 characters, with a letter and a number."
                required
              />
              <FormField
                id="register-confirm"
                label="Confirm password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />
              <div className="form-check mb-3">
                <input
                  id="register-show-password"
                  type="checkbox"
                  className="form-check-input"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
                <label htmlFor="register-show-password" className="form-check-label">
                  Show passwords
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating your account…' : 'Create account'}
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              Already have an account?{' '}
              <Link to="/login" state={location.state}>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
