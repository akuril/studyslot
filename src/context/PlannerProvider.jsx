import { useEffect, useState, useSyncExternalStore } from 'react';
import { PlannerContext } from './PlannerContext';
import { sampleClasses } from '../data/classes';
import { sampleAssignments } from '../data/assignments';
import { createId } from '../utils/createId';
import {
  getSaveFailed,
  loadFromStorage,
  saveToStorage,
  subscribeToSaveStatus,
} from '../utils/storage';
import { todayString } from '../utils/dates';
import { cleanAssignment, cleanClass, cleanList } from '../utils/validate';

// How long the "Undo" message stays on screen.
const UNDO_SECONDS = 7;

// Loads a saved list (or the sample data), keeping only items that pass `cleanItem`.
function loadList(key, fallbackList, cleanItem) {
  const savedList = loadFromStorage(key, fallbackList);
  const list = Array.isArray(savedList) ? savedList : fallbackList;
  return cleanList(list, cleanItem);
}

// Returns a NEW array with `item` placed at `index`.
function insertAt(list, index, item) {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

export function PlannerProvider({ children }) {
  const [classes, setClasses] = useState(() =>
    loadList('classes', sampleClasses, cleanClass)
  );
  const [assignments, setAssignments] = useState(() =>
    loadList('assignments', sampleAssignments, cleanAssignment)
  );

  // The most recent deletion, kept so it can be undone (null = nothing to undo).
  const [lastDeleted, setLastDeleted] = useState(null);

  // True if the browser refused to save (read from the storage module's own store).
  const storageError = useSyncExternalStore(subscribeToSaveStatus, getSaveFailed);

  // Save each list whenever it changes. (Effects only sync with storage; no setState here.)
  useEffect(() => {
    saveToStorage('classes', classes);
  }, [classes]);

  useEffect(() => {
    saveToStorage('assignments', assignments);
  }, [assignments]);

  // Hide the "Undo" message automatically after a few seconds.
  useEffect(() => {
    if (lastDeleted === null) {
      return;
    }

    const timerId = setTimeout(() => setLastDeleted(null), UNDO_SECONDS * 1000);

    // Cleanup: cancel this timer if another delete happens first.
    return () => clearTimeout(timerId);
  }, [lastDeleted]);

  // ===== Classes =====

  function addClass(classData) {
    const newClass = { id: createId(), ...classData };
    setClasses((currentClasses) => [...currentClasses, newClass]);
  }

  function updateClass(classId, classData) {
    setClasses((currentClasses) =>
      currentClasses.map((classItem) =>
        classItem.id === classId ? { ...classItem, ...classData } : classItem
      )
    );
  }

  function deleteClass(classId) {
    const classIndex = classes.findIndex((classItem) => classItem.id === classId);

    if (classIndex === -1) {
      return;
    }

    const deletedClass = classes[classIndex];
    const deletedAssignments = assignments.filter((assignment) => assignment.classId === classId);

    setClasses((currentClasses) =>
      currentClasses.filter((classItem) => classItem.id !== classId)
    );
    // Also remove this class's assignments so none are left without a class.
    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.classId !== classId)
    );

    const count = deletedAssignments.length;
    setLastDeleted({
      id: createId(),
      type: 'class',
      message:
        count > 0
          ? `Deleted "${deletedClass.name}" and ${count} ${count === 1 ? 'assignment' : 'assignments'}`
          : `Deleted "${deletedClass.name}"`,
      classItem: deletedClass,
      index: classIndex,
      assignments: deletedAssignments,
    });
  }

  function getClassById(classId) {
    return classes.find((classItem) => classItem.id === classId);
  }

  // ===== Assignments =====

  function addAssignment(assignmentData) {
    const newAssignment = {
      id: createId(),
      completed: false,
      completedAt: null,
      subtasks: [],
      ...assignmentData,
    };
    setAssignments((currentAssignments) => [...currentAssignments, newAssignment]);
  }

  function updateAssignment(assignmentId, assignmentData) {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === assignmentId ? { ...assignment, ...assignmentData } : assignment
      )
    );
  }

  function deleteAssignment(assignmentId) {
    const index = assignments.findIndex((assignment) => assignment.id === assignmentId);

    if (index === -1) {
      return;
    }

    const deletedAssignment = assignments[index];

    setAssignments((currentAssignments) =>
      currentAssignments.filter((assignment) => assignment.id !== assignmentId)
    );

    setLastDeleted({
      id: createId(),
      type: 'assignment',
      message: `Deleted "${deletedAssignment.title}"`,
      assignment: deletedAssignment,
      index: index,
    });
  }

  function toggleAssignmentComplete(assignmentId) {
    const today = todayString();

    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) => {
        if (assignment.id !== assignmentId) {
          return assignment;
        }

        const nowCompleted = !assignment.completed;

        return {
          ...assignment,
          completed: nowCompleted,
          completedAt: nowCompleted ? today : null,
        };
      })
    );
  }

  // ===== Steps (subtasks) inside an assignment =====

  // Applies `changeFn` to one assignment's steps list and saves the result.
  // Handles the outer levels so each step function only describes the change itself.
  function changeSubtasks(assignmentId, changeFn) {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) =>
        assignment.id === assignmentId
          ? { ...assignment, subtasks: changeFn(assignment.subtasks || []) }
          : assignment
      )
    );
  }

  function addSubtasks(assignmentId, titles) {
    const newSteps = titles.map((title) => ({ id: createId(), title: title, done: false }));
    changeSubtasks(assignmentId, (steps) => [...steps, ...newSteps]);
  }

  function toggleSubtask(assignmentId, stepId) {
    changeSubtasks(assignmentId, (steps) =>
      steps.map((step) => (step.id === stepId ? { ...step, done: !step.done } : step))
    );
  }

  function deleteSubtask(assignmentId, stepId) {
    const assignment = assignments.find((item) => item.id === assignmentId);
    const steps = assignment ? assignment.subtasks || [] : [];
    const index = steps.findIndex((step) => step.id === stepId);

    if (index === -1) {
      return;
    }

    const deletedStep = steps[index];

    changeSubtasks(assignmentId, (currentSteps) =>
      currentSteps.filter((step) => step.id !== stepId)
    );

    setLastDeleted({
      id: createId(),
      type: 'step',
      message: `Removed step "${deletedStep.title}"`,
      assignmentId: assignmentId,
      step: deletedStep,
      index: index,
    });
  }

  // ===== Undo =====

  function undoDelete() {
    if (lastDeleted === null) {
      return;
    }

    if (lastDeleted.type === 'assignment') {
      setAssignments((currentAssignments) =>
        insertAt(currentAssignments, lastDeleted.index, lastDeleted.assignment)
      );
    } else if (lastDeleted.type === 'class') {
      setClasses((currentClasses) =>
        insertAt(currentClasses, lastDeleted.index, lastDeleted.classItem)
      );
      setAssignments((currentAssignments) => [...currentAssignments, ...lastDeleted.assignments]);
    } else if (lastDeleted.type === 'step') {
      changeSubtasks(lastDeleted.assignmentId, (steps) =>
        insertAt(steps, lastDeleted.index, lastDeleted.step)
      );
    }

    setLastDeleted(null);
  }

  function dismissUndo() {
    setLastDeleted(null);
  }

  const value = {
    classes,
    addClass,
    updateClass,
    deleteClass,
    getClassById,
    assignments,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    toggleAssignmentComplete,
    addSubtasks,
    toggleSubtask,
    deleteSubtask,
    lastDeleted,
    undoDelete,
    dismissUndo,
    undoSeconds: UNDO_SECONDS,
    storageError,
  };

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}