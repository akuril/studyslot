import { Link } from 'react-router-dom';

const STEPS = [
  {
    icon: '🔎',
    title: 'Find the right help',
    text: 'Browse tutoring for math, science, English, test prep, and homework help, or describe what your student needs and get a suggestion.',
  },
  {
    icon: '🗓️',
    title: 'Pick a time',
    text: 'Choose a session time that fits your week. You can reschedule or cancel later.',
  },
  {
    icon: '📋',
    title: 'Stay organized',
    text: 'See every upcoming session in one dashboard, so nothing gets missed.',
  },
];

function HomePage() {
  return (
    <div>
      <section className="text-center py-4 py-md-5">
        <p className="display-3 mb-2" aria-hidden="true">
          🎓
        </p>
        <h1 className="display-5 fw-bold mb-3">Book the right tutor in a few clicks.</h1>
        <p className="lead text-secondary mx-auto mb-0" style={{ maxWidth: '40rem' }}>
          StudySlot helps parents and guardians book tutoring sessions for students in grades 6–12.
        </p>
      </section>

      <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mb-4">
        <Link to="/services" className="btn btn-primary btn-lg">
          Browse tutoring services
        </Link>
      </div>

      <div className="alert alert-info text-center" role="status">
        <strong>StudySlot is being built.</strong> Parent accounts and online booking are coming
        next.
      </div>

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="h4 fw-bold text-center my-4">
          How it works
        </h2>

        <div className="row g-3">
          {STEPS.map((step, index) => (
            <div className="col-12 col-md-4" key={step.title}>
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <p className="fs-2 mb-2" aria-hidden="true">
                    {step.icon}
                  </p>
                  <h3 className="h5 fw-bold">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-secondary mb-0">{step.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
