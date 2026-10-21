import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/authValidation';

// After logging in, go back to the page that sent the user here (or the dashboard).
// Only same-site paths are allowed, so a crafted link can't redirect somewhere else.
function getReturnPath(location) {
  const from = location.state && location.state.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//')
    ? from
    : '/dashboard';
}

function LoginPage() {
  const { user, login, sessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnPath = getReturnPath(location);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in (e.g. pressed Back after logging in): skip the form.
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
      return; // ignore double clicks
    }

    const clientErrors = validateLogin(form);
    setErrors(clientErrors);
    setServerError('');
    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(returnPath, { replace: true });
    } catch (error) {
      setErrors(error.fieldErrors || {});
      setServerError(error.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-8 col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <h1 className="h3 fw-bold mb-1">Log in</h1>
            <p className="text-secondary">Welcome back! Log in to book and manage sessions.</p>

            {sessionExpired && !serverError && (
              <div className="alert alert-warning" role="status">
                Your session expired. Please log in again.
              </div>
            )}
            {location.state && location.state.from && !sessionExpired && !serverError && (
              <div className="alert alert-info" role="status">
                Please log in to continue.
              </div>
            )}
            {serverError && (
              <div className="alert alert-danger" role="alert">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                id="login-email"
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
                id="login-password"
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
              <div className="form-check mb-3">
                <input
                  id="login-show-password"
                  type="checkbox"
                  className="form-check-input"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                />
                <label htmlFor="login-show-password" className="form-check-label">
                  Show password
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in…' : 'Log in'}
              </button>
            </form>

            <p className="text-center mt-3 mb-0">
              New to StudySlot?{' '}
              <Link to="/register" state={location.state}>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
