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
    console.error('StudySlot: something crashed.', error, info.componentStack);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false });
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
          This part of StudySlot hit a problem. Please try again.
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
          <button type="button" className="btn btn-primary btn-lg" onClick={this.handleTryAgain}>
            Try again
          </button>
          {/* A plain link (not <Link>) does a full page reload for a completely fresh start. */}
          <a href={import.meta.env.BASE_URL} className="btn btn-outline-primary btn-lg">
            Go to Home
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
