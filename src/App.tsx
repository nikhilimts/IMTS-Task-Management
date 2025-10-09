import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authService from './services/authService';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import TaskDetail from './pages/TaskDetail';
import TaskCreate from './pages/TaskCreate';
import Tasks from './pages/Tasks';
import GroupTaskDetail from './pages/GroupTaskDetail';
import OverviewerTaskDetail from './pages/OverviewerTaskDetail';
import HODDashboard from './pages/HODDashboard';
import HODTasks from './pages/HODTasks';
import HODEmployees from './pages/HODEmployees';
import HODEmployeeDetail from './pages/HODEmployeeDetail';
import HODReports from './pages/HODReports';
import SystemAdminDashboard from './pages/SystemAdminDashboard';
import AdminDepartments from './pages/AdminDepartments';
import AdminDepartmentDetail from './pages/AdminDepartmentDetail';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated || !user) {
    // Clear any invalid tokens
    authService.logout();
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if user has that role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user's actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (user.role === 'hod') {
      return <Navigate to="/hod/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Allow access to public routes regardless of authentication status
  // Users can access login/signup even if they have a token
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // Clear any invalid authentication state on app start
    const token = authService.getToken();
    if (token) {
      // Validate token by checking if user data exists
      const user = authService.getCurrentUser();
      if (!user) {
        // Token exists but no user data, clear everything
        authService.logout();
      }
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public routes - allow access regardless of authentication */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/new"
          element={
            <ProtectedRoute>
              <TaskCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute>
              <TaskDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id/overview"
          element={
            <ProtectedRoute>
              <OverviewerTaskDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks/:id/group"
          element={
            <ProtectedRoute>
              <GroupTaskDetail />
            </ProtectedRoute>
          }
        />

        {/* HOD routes */}
        <Route
          path="/hod/dashboard"
          element={
            <ProtectedRoute>
              <HODDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/tasks"
          element={
            <ProtectedRoute>
              <HODTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/employees"
          element={
            <ProtectedRoute>
              <HODEmployees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/employees/:employeeId"
          element={
            <ProtectedRoute>
              <HODEmployeeDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hod/reports"
          element={
            <ProtectedRoute>
              <HODReports />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <SystemAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDepartments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/departments/:departmentId"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDepartmentDetail />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  );
}

export default App;
