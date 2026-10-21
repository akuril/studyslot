import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthProvider';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import BookServicePage from './pages/BookServicePage';
import DashboardPage from './pages/DashboardPage';
import BookingDetailsPage from './pages/BookingDetailsPage';
import EditBookingPage from './pages/EditBookingPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:id" element={<ServiceDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Pages that need a login */}
            <Route element={<ProtectedRoute />}>
              <Route path="/services/:id/book" element={<BookServicePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/bookings/:id" element={<BookingDetailsPage />} />
              <Route path="/bookings/:id/edit" element={<EditBookingPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
