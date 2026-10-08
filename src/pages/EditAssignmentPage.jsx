import { Link, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import AssignmentForm from '../components/AssignmentForm';
import { usePlanner } from '../context/PlannerContext';
import { useGoBack } from '../hooks/useGoBack';

function EditAssignmentPage() {
  const { id } = useParams();
  const { classes, assignments, updateAssignment } = usePlanner();
  const goBack = useGoBack(`/assignments/${id}`);

  const assignment = assignments.find((item) => item.id === id);

  function handleSave(assignmentData) {
    updateAssignment(assignment.id, assignmentData);
    goBack();
  }

  if (!assignment) {
    return (
      <div>
        <PageHeader title="Edit Assignment" />
        <EmptyState
          icon="🔍"
          title="We couldn't find that assignment"
          message="It may have been deleted, or the link might be wrong."
        >
          <Link to="/assignments" className="btn btn-primary btn-lg">
            Back to Assignments
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-lg-8 col-xl-7">
        <PageHeader title="Edit Assignment" subtitle={assignment.title} />
        <AssignmentForm
          key={assignment.id}
          initialAssignment={assignment}
          classes={classes}
          onSave={handleSave}
          onCancel={goBack}
        />
      </div>
    </div>
  );
}

export default EditAssignmentPage;