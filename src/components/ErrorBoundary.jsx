import { Component } from 'react';

// Error boundaries must be class components (the one place React still requires them).
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  // Called when a component inside this boundary crashes while rendering.
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // A good place to log the details for developers.
  componentDidCatch(error, info) {
    console.error('HomeworkHQ: something crashed.', error, info.componentStack);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false });
  };

  handleResetData = () => {
    const confirmed = window.confirm(
      'This deletes ALL your classes and assignments on this device and starts over. ' +
        'Only do this if the app keeps crashing. Continue?'
    );

    if (!confirmed) {
      return;
    }

    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith('homeworkhq-'))
        .forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      console.error('HomeworkHQ: could not clear storage.', error);
    }

    window.location.href = import.meta.env.BASE_URL;
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="text-center py-5 px-3">
        <p className="display-1 mb-2" aria-hidden="true">
          😵
        </p>
        <h1 className="h3 fw-bold">Oops! Something went wrong.</h1>
        <p className="text-secondary mb-4">
          This part of HomeworkHQ hit a problem. Your saved work should still be safe.
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mb-4">
          <button type="button" className="btn btn-primary btn-lg" onClick={this.handleTryAgain}>
            Try again
          </button>
          <a href={import.meta.env.BASE_URL} className="btn btn-outline-primary btn-lg">
            Go to Dashboard
          </a>
        </div>

        <button
          type="button"
          className="btn btn-link btn-sm text-danger"
          onClick={this.handleResetData}
        >
          Still broken? Reset app data
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;