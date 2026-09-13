import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  CalendarDays,
  Bell,
  BarChart3,
  LogOut,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">

      {/* =====================================================
          LOGO
      ===================================================== */}

      <div className="sidebar-logo">

        <div className="sidebar-logo-icon">
          <Wallet size={24} />
        </div>

        <div>
          <h2>FinancePro</h2>
          <span>Loan Management</span>
        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="sidebar-navigation">

        <div className="sidebar-section-title">
          MAIN MENU
        </div>


        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>


        <NavLink
          to="/customers"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Users size={19} />
          <span>Customers</span>
        </NavLink>


        <NavLink
          to="/loans"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <CreditCard size={19} />
          <span>Loans</span>
        </NavLink>


        <NavLink
          to="/payments"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Wallet size={19} />
          <span>Payments</span>
        </NavLink>


        <NavLink
          to="/installments"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <CalendarDays size={19} />
          <span>Installments</span>
        </NavLink>


        <div className="sidebar-section-title">
          MANAGEMENT
        </div>


        <NavLink
          to="/reminders"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <Bell size={19} />
          <span>Reminders</span>
        </NavLink>


        <NavLink
          to="/reports"
          className={({ isActive }) =>
            isActive
              ? "sidebar-link active"
              : "sidebar-link"
          }
        >
          <BarChart3 size={19} />
          <span>Reports</span>
        </NavLink>

      </nav>


      {/* =====================================================
          LOGOUT
      ===================================================== */}

      <div className="sidebar-bottom">

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;4201