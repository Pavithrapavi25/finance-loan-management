import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Customers from "./pages/customers";
import CustomerDetails from "./pages/customerdetails";
import Loans from "./pages/loans";
import LoanDetails from "./pages/loandetails";
import DashboardLayout from "./components/dashboardlayout";

import { useAuth } from "./context/AuthContext.jsx";

import Payments from "./pages/Payments";
import Installments from "./pages/Installments";
import Reminders from "./pages/Reminders";
import ReminderDetails from "./pages/ReminderDetails";
import CreateReminder from "./pages/CreateReminder";
import Reports from "./pages/Reports";


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}


function DashboardPage() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}


function PlaceholderPage({ title }) {
  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>
        This module will be available soon.
      </p>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Customers */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Customers />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Customer Details */}
        <Route
          path="/customers/:customerId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CustomerDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Loans */}
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Loans />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Loan Details */}
        <Route
          path="/loans/:loanId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LoanDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Payments */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Payments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Installments */}
        <Route
          path="/installments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Installments />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Create Reminder */}
        <Route
          path="/reminders/create"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CreateReminder />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Reminder Details */}
        <Route
          path="/reminders/:reminderId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ReminderDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Reminders */}
        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reminders />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        {/* Unknown Routes */}
        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}


export default App;
