import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import AssignmentForm from '../components/AssignmentForm';
import { usePlanner } from '../context/PlannerContext';
import { useGoBack } from '../hooks/useGoBack';

function AddAssignmentPage() {
  const { classes, addAssignment } = usePlanner();
  const [searchParams] = useSearchParams();
  const goBack = useGoBack('/assignments');

  // Only use the class from the URL if it really exists.
  const requestedClassId = searchParams.get('classId');
  const defaultClassId = classes.some((classItem) => classItem.id === requestedClassId)
    ? requestedClassId
    : '';

  function handleSave(assignmentData) {
    addAssignment(assignmentData);
    goBack();
  }

  if (classes.length === 0) {
    return (
      <div>
        <PageHeader title="Add Assignment" />
        <EmptyState
          icon="🎒"
          title="Add a class first"
          message="Every assignment belongs to a class. Add your classes, then come back here."
        >
          <Link to="/classes" className="btn btn-primary btn-lg">
            Go to My Classes
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        <PageHeader title="Add Assignment" subtitle="What do you need to get done?" />
        <AssignmentForm
          initialAssignment={null}
          classes={classes}
          defaultClassId={defaultClassId}
          onSave={handleSave}
          onCancel={goBack}
        />
      </div>
    </div>
  );
}

export default AddAssignmentPage;