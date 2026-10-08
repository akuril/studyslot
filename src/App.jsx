import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { PlannerProvider } from './context/PlannerProvider';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AddAssignmentPage from './pages/AddAssignmentPage';
import AssignmentDetailsPage from './pages/AssignmentDetailsPage';
import EditAssignmentPage from './pages/EditAssignmentPage';
import ClassesPage from './pages/ClassesPage';
import ClassDetailsPage from './pages/ClassDetailsPage';
import WeekPage from './pages/WeekPage';
import TodayPage from './pages/TodayPage';
import DonePage from './pages/DonePage';
import MonthPage from './pages/MonthPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <PlannerProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/done" element={<DonePage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/assignments/new" element={<AddAssignmentPage />} />
            <Route path="/assignments/:id" element={<AssignmentDetailsPage />} />
            <Route path="/assignments/:id/edit" element={<EditAssignmentPage />} />
            <Route path="/classes" element={<ClassesPage />} />
            <Route path="/classes/:id" element={<ClassDetailsPage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PlannerProvider>
  );
}

export default App;