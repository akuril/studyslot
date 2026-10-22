import { Link } from 'react-router-dom';
import HeroArt from '../components/HeroArt';
import SubjectArt from '../components/SubjectArt';
import { SUBJECTS } from '../utils/services';

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
      <section className="row align-items-center g-4 py-3 py-md-5">
        <div className="col-12 col-lg-6 text-center text-lg-start">
          <h1 className="display-5 fw-bold mb-3">Book the right tutor in a few clicks.</h1>
          <p className="lead text-secondary mb-4">
            StudySlot helps parents and guardians book tutoring sessions for students in grades
            6–12.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center justify-content-lg-start gap-2">
            <Link to="/services" className="btn btn-primary btn-lg">
              Browse tutoring services
            </Link>
            <Link to="/find-help" className="btn btn-outline-primary btn-lg">
              ✨ Get an AI suggestion
            </Link>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <HeroArt className="mx-auto" />
        </div>
      </section>

      <section aria-labelledby="browse-by-subject" className="mb-5">
        <h2 id="browse-by-subject" className="h4 fw-bold text-center my-4">
          Browse by subject
        </h2>
        <div className="row g-3">
          {SUBJECTS.map((subject) => (
            <div className="col-6 col-md-4" key={subject.value}>
              <Link
                to={`/services?subject=${subject.value}`}
                className="card border-0 shadow-sm h-100 overflow-hidden text-decoration-none subject-tile"
              >
                <SubjectArt subject={subject.value} />
                <span className="card-body py-2 px-3 fw-semibold text-body">{subject.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

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
