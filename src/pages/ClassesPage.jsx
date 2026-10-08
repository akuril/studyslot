import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import ClassCard from '../components/ClassCard';
import ClassForm from '../components/ClassForm';
import { usePlanner } from '../context/PlannerContext';
import { getProgress } from '../utils/progress';

function ClassesPage() {
  const { classes, assignments, addClass, updateClass, deleteClass } = usePlanner();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Names the form should treat as "already taken".
  // When editing, the class's own current name is allowed.
  const takenNames = classes
    .filter((classItem) => editingClass === null || classItem.id !== editingClass.id)
    .map((classItem) => classItem.name.toLowerCase());

  function openAddForm() {
    setEditingClass(null);
    setIsFormOpen(true);
  }

  function openEditForm(classItem) {
    setEditingClass(classItem);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingClass(null);
  }

  function handleSave(formData) {
    if (editingClass) {
      updateClass(editingClass.id, formData);
    } else {
      addClass(formData);
    }

    closeForm();
  }

  function handleDelete(classItem) {
    deleteClass(classItem.id);

    if (editingClass && editingClass.id === classItem.id) {
      closeForm();
    }
  }

  return (
    <div>
      <PageHeader
        title="My Classes"
        subtitle="Add your classes, teachers, and a color for each one."
      >
        <button type="button" className="btn btn-primary" onClick={openAddForm}>
          + Add Class
        </button>
      </PageHeader>

      {isFormOpen && (
        <ClassForm
          key={editingClass ? editingClass.id : 'new'}
          initialClass={editingClass}
          takenNames={takenNames}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}

      {classes.length === 0 ? (
        !isFormOpen && (
          <EmptyState
            icon="🎒"
            title="No classes yet"
            message="Add your first class to start organizing your homework."
          >
            <button type="button" className="btn btn-primary btn-lg" onClick={openAddForm}>
              + Add Your First Class
            </button>
          </EmptyState>
        )
      ) : (
        <div className="row g-3">
          {classes.map((classItem) => (
            <div className="col-12 col-sm-6 col-lg-4" key={classItem.id}>
                            <ClassCard
                classItem={classItem}
                progress={getProgress(
                  assignments.filter((assignment) => assignment.classId === classItem.id)
                )}
                onEdit={openEditForm}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClassesPage;