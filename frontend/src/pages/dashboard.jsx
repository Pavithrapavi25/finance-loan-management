import { useEffect, useState } from "react";

import {
  Users,
  CreditCard,
  Activity,
  CheckCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  Percent,
  IndianRupee,
  AlertTriangle,
  CalendarDays,
  Banknote,
  LogOut,
  Bell,
  RefreshCw,
  UserPlus,
  Plus,
  TrendingUp,
  CalendarClock,
  AlertCircle,
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";


function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="metric-card">

      <div className="metric-card-top">

        <div className="metric-icon">
          <Icon size={22} />
        </div>

      </div>

      <div className="metric-title">
        {title}
      </div>

      <div className="metric-value">
        {value}
      </div>

      {description && (
        <div className="metric-description">
          {description}
        </div>
      )}

    </div>
  );
}


function InsightCard({
  title,
  value,
  description,
  icon: Icon,
  className = "",
}) {
  return (
    <div className={`insight-card ${className}`}>

      <div className="insight-card-top">

        <div className="insight-icon">
          <Icon size={22} />
        </div>

      </div>

      <div className="insight-title">
        {title}
      </div>

      <div className="insight-value">
        {value}
      </div>

      <div className="insight-description">
        {description}
      </div>

    </div>
  );
}


function Dashboard() {

  const { logout, token } = useAuth();

  const navigate = useNavigate();


  const [user, setUser] = useState(null);

  const [summary, setSummary] = useState(null);

  const [dashboardAlerts, setDashboardAlerts] =
    useState(null);

  const [upcomingPayments, setUpcomingPayments] =
    useState([]);

  const [overduePayments, setOverduePayments] =
    useState([]);

  const [paymentCollections, setPaymentCollections] =
    useState([]);

  const [businessInsights, setBusinessInsights] =
    useState(null);

  const [paymentDays, setPaymentDays] =
    useState(30);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // =====================================================
  // LIVE CLOCK
  // =====================================================

  const [currentTime, setCurrentTime] =
    useState(new Date());


  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  const fetchDashboardData = async () => {

    try {

      setError("");

      const [
        summaryResponse,
        upcomingResponse,
        overdueResponse,
        collectionsResponse,
        insightsResponse,
        alertsResponse,
      ] = await Promise.all([

        api.get(
          "/dashboard/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        api.get(
          `/dashboard/upcoming-payments?days_ahead=${paymentDays}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        api.get(
          "/dashboard/overdue-payments",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        api.get(
          "/dashboard/payment-collections",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        api.get(
          "/dashboard/business-insights",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        api.get(
          "/dashboard/alerts",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

      ]);


      setSummary(
        summaryResponse.data
      );

      setUpcomingPayments(
        upcomingResponse.data
      );

      setOverduePayments(
        overdueResponse.data
      );

      setPaymentCollections(
        collectionsResponse.data
      );

      setBusinessInsights(
        insightsResponse.data
      );

      setDashboardAlerts(
        alertsResponse.data
      );

      setLastUpdated(
        new Date()
      );


    } catch (error) {

      console.error(
        "Dashboard error:",
        error
      );

      if (error.response) {

        setError(
          error.response.data.detail ||
          "Failed to load dashboard"
        );

      } else {

        setError(
          "Cannot connect to the backend"
        );

      }

    }

  };


  // =====================================================
  // FETCH USER
  // =====================================================

  const fetchUser = async () => {

    try {

      const response = await api.get(
        "/auth/me",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(
        response.data
      );

    } catch (error) {

      console.error(
        "User profile error:",
        error
      );

    }

  };


  // =====================================================
  // INITIAL LOAD + PAYMENT FILTER + AUTO REFRESH
  // =====================================================
    useEffect(() => {
  if (!token) {
    return;
  }

  // Fetch dashboard data when the page loads
  fetchDashboardData();
  fetchUser();

  // Automatically refresh every 60 seconds
  const refreshInterval = setInterval(() => {
    fetchDashboardData();
  }, 60000);

  // Refresh immediately when the user returns to the dashboard
  const handleWindowFocus = () => {
    fetchDashboardData();
  };

  window.addEventListener(
    "focus",
    handleWindowFocus
  );

  return () => {
    clearInterval(refreshInterval);

    window.removeEventListener(
      "focus",
      handleWindowFocus
    );
  };
}, [token, paymentDays]);

  // =====================================================
  // LIVE CLOCK AUTO REFRESH
  // =====================================================

  useEffect(() => {

    const updateClock = () => {

      setCurrentTime(
        new Date()
      );

    };


    // Update immediately

    updateClock();


    // Update live time every 60 seconds

    const clockInterval = setInterval(
      updateClock,
      60000
    );


    // Clean up clock timer

    return () => {

      clearInterval(
        clockInterval
      );

    };

  }, []);


  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  const refreshDashboard = async () => {

    try {

      setRefreshing(true);

      await fetchDashboardData();

    } finally {

      setRefreshing(false);

    }

  };


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {

    return `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  };


  // =====================================================
  // NAVIGATION
  // =====================================================

  const goToCustomers = () => {

    navigate(
      "/customers"
    );

  };


  const goToLoans = () => {

    navigate(
      "/loans"
    );

  };


  const goToPayments = () => {

    navigate(
      "/payments"
    );

  };


  // =====================================================
  // NOTIFICATION BELL
  // STEP 7.10 - SAFE ALERT DATA
  // =====================================================

  const handleNotificationClick = () => {

    navigate(
      "/payments"
    );

  };


  const handleNotificationKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      handleNotificationClick();

    }

  };


  // =====================================================
  // ERROR STATE
  // =====================================================

  if (error) {

    return (

      <div className="dashboard-page">

        <div className="dashboard-error">

          <AlertTriangle size={40} />

          <h1>
            Finance & Loan Management Dashboard
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >

            <LogOut size={18} />

            Logout

          </button>

        </div>

      </div>

    );

  }


  // =====================================================
  // LOADING STATE
  // =====================================================

  if (
    !summary ||
    !businessInsights ||
    !dashboardAlerts
  ) {

    return (

      <div className="dashboard-loading">

        <h2>
          Loading dashboard...
        </h2>

      </div>

    );

  }


  // =====================================================
  // CHART DATA
  // =====================================================

  const loanStatusData = [

    {
      name: "Active",
      value: Number(
        summary.active_loans || 0
      ),
    },

    {
      name: "Completed",
      value: Number(
        summary.completed_loans || 0
      ),
    },

    {
      name: "Pending",
      value: Number(
        summary.pending_loans || 0
      ),
    },

    {
      name: "Cancelled",
      value: Number(
        summary.cancelled_loans || 0
      ),
    },

  ].filter(
    (item) => item.value > 0
  );


  const financialData = [

    {
      name: "Principal",
      amount: Number(
        summary.total_principal_issued || 0
      ),
    },

    {
      name: "Interest",
      amount: Number(
        summary.total_interest || 0
      ),
    },

    {
      name: "Collected",
      amount: Number(
        summary.total_collected || 0
      ),
    },

    {
      name: "Outstanding",
      amount: Number(
        summary.outstanding_amount || 0
      ),
    },

  ];


  const collectionData =
    paymentCollections.map(
      (item) => ({
        name: item.payment_method,
        amount: Number(
          item.total_collected || 0
        ),
      })
    );


  const chartColors = [
    "#2563eb",
    "#16a34a",
    "#f59e0b",
    "#dc2626",
  ];


  return (

    <div className="dashboard-page">


      {/* =================================================
          TOP HEADER
          ================================================= */}

      <div className="top-header">

        <div className="top-header-left">

          <div>

            <h2>
              Dashboard
            </h2>

            <p>
              Welcome back! Here's your
              financial overview.
            </p>

          </div>

        </div>


        <div className="top-header-right">


          <div className="header-date">

            <CalendarDays size={18} />

            <span>

              {currentTime.toLocaleDateString(
                "en-IN",
                {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}

            </span>

          </div>


          {/* =================================================
              LIVE TIME
              ================================================= */}

          <div className="dashboard-live-time">

            <span className="dashboard-live-time-icon">
              🕐
            </span>

            <span className="dashboard-live-time-value">

              {currentTime.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}

            </span>

          </div>


          {/* =================================================
              STEP 7.10 - SAFE NOTIFICATION BELL
              ================================================= */}

          <div
            className={
              Number(
                dashboardAlerts?.total_alerts || 0
              ) > 0
                ? "notification-icon notification-has-alerts"
                : "notification-icon"
            }
            onClick={
              handleNotificationClick
            }
            role="button"
            tabIndex={0}
            aria-label={
              Number(
                dashboardAlerts?.total_alerts || 0
              ) > 0
                ? `${Number(
                    dashboardAlerts?.total_alerts || 0
                  )} payment alerts. Open payments.`
                : "No payment alerts. Open payments."
            }
            onKeyDown={
              handleNotificationKeyDown
            }
          >

            <Bell size={19} />

            {Number(
              dashboardAlerts?.total_alerts || 0
            ) > 0 && (

              <span className="notification-dot">

                {Number(
                  dashboardAlerts?.total_alerts || 0
                )}

              </span>

            )}

          </div>


          <div className="dashboard-actions">

            <button
              type="button"
              className="dashboard-action-button"
              onClick={refreshDashboard}
              disabled={refreshing}
            >

              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "refresh-spinning"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}

            </button>


            <button
              type="button"
              className="dashboard-action-button"
              onClick={goToCustomers}
            >

              <UserPlus size={17} />

              Customer

            </button>


            <button
              type="button"
              className="dashboard-action-button"
              onClick={goToLoans}
            >

              <Plus size={17} />

              Loan

            </button>


            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >

              <LogOut size={18} />

              Logout

            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN METRICS
          ================================================= */}

      <section className="metrics-grid">

        <MetricCard
          title="Total Customers"
          value={summary.total_customers}
          icon={Users}
          description="Registered customers"
        />

        <MetricCard
          title="Total Loans"
          value={summary.total_loans}
          icon={CreditCard}
          description="All loan accounts"
        />

        <MetricCard
          title="Active Loans"
          value={summary.active_loans}
          icon={Activity}
          description="Currently active"
        />

        <MetricCard
          title="Completed Loans"
          value={summary.completed_loans}
          icon={CheckCircle}
          description="Successfully completed"
        />

        <MetricCard
          title="Pending Loans"
          value={summary.pending_loans}
          icon={Clock}
          description="Awaiting processing"
        />

        <MetricCard
          title="Cancelled Loans"
          value={summary.cancelled_loans}
          icon={XCircle}
          description="Cancelled accounts"
        />

      </section>


      {/* =================================================
          FINANCIAL OVERVIEW
          ================================================= */}

      <section className="section-heading">

        <div>

          <h2>
            Financial Overview
          </h2>

          <p>
            Overall financial performance of
            your loan portfolio.
          </p>

        </div>

      </section>


      <section className="metrics-grid financial-grid">

        <MetricCard
          title="Principal Issued"
          value={formatCurrency(
            summary.total_principal_issued
          )}
          icon={Wallet}
          description="Total principal amount"
        />

        <MetricCard
          title="Total Interest"
          value={formatCurrency(
            summary.total_interest
          )}
          icon={Percent}
          description="Expected interest"
        />

        <MetricCard
          title="Total Payable"
          value={formatCurrency(
            summary.total_payable
          )}
          icon={IndianRupee}
          description="Principal + interest"
        />

        <MetricCard
          title="Total Collected"
          value={formatCurrency(
            summary.total_collected
          )}
          icon={Banknote}
          description="Payments received"
        />

        <MetricCard
          title="Outstanding Amount"
          value={formatCurrency(
            summary.outstanding_amount
          )}
          icon={AlertTriangle}
          description="Amount still to collect"
        />

        <MetricCard
          title="Average Loan"
          value={formatCurrency(
            summary.average_loan_amount
          )}
          icon={IndianRupee}
          description="Average loan amount"
        />

      </section>


      {/* =================================================
          BUSINESS INSIGHTS
          ================================================= */}

      <section className="section-heading">

        <div>

          <h2>
            Business Insights
          </h2>

          <p>
            Important information to help manage
            your loan business.
          </p>

        </div>

      </section>


      <section className="insights-grid">

        <InsightCard
          title="Active Customers"
          value={
            businessInsights.active_customers
          }
          icon={Users}
          description="Customers with active loans"
        />


        <InsightCard
          title="Due in Next 7 Days"
          value={
            businessInsights.due_soon_count
          }
          icon={CalendarClock}
          description={
            `${formatCurrency(
              businessInsights.due_soon_amount
            )} to collect`
          }
          className="insight-warning"
        />


        <InsightCard
          title="Overdue Amount"
          value={
            formatCurrency(
              businessInsights.overdue_amount
            )
          }
          icon={AlertCircle}
          description="Outstanding overdue amount"
          className={
            Number(
              businessInsights.overdue_amount || 0
            ) > 0
              ? "insight-danger"
              : "insight-success"
          }
        />


        <InsightCard
          title="This Month's Collection"
          value={
            formatCurrency(
              businessInsights.collection_this_month
            )
          }
          icon={TrendingUp}
          description="Payments collected this month"
          className="insight-success"
        />

      </section>


      {/* =================================================
          STEP 7.7 - ALERT & ACTION CENTER
          ================================================= */}

      <section className="alert-center-section">

        <div className="section-header">

          <div>

            <h2>
              Alerts & Action Center
            </h2>

            <p>
              Important payment activity that may need attention.
            </p>

          </div>


          <div className="alert-total-badge">

            <Bell size={16} />

            {dashboardAlerts.total_alerts} Alerts

          </div>

        </div>


        <div className="alert-center-grid">


          {/* =================================================
              OVERDUE PAYMENTS
              ================================================= */}

          <div
            className={`alert-action-card alert-clickable ${
              dashboardAlerts.overdue_count > 0
                ? "alert-danger"
                : "alert-safe"
            }`}
            onClick={goToPayments}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {

              if (
                event.key === "Enter" ||
                event.key === " "
              ) {

                event.preventDefault();

                goToPayments();

              }

            }}
          >

            <div className="alert-card-icon">

              {dashboardAlerts.overdue_count > 0 ? (

                <AlertTriangle size={22} />

              ) : (

                <CheckCircle2 size={22} />

              )}

            </div>


            <div className="alert-card-content">

              <h3>
                Overdue Payments
              </h3>


              <div className="alert-card-number">

                {dashboardAlerts.overdue_count}

              </div>


              <p>

                {dashboardAlerts.overdue_count > 0

                  ? `${formatCurrency(
                      dashboardAlerts.overdue_amount
                    )} requires attention`

                  : "No overdue payments 🎉"}

              </p>

            </div>

          </div>


          {/* =================================================
              DUE SOON
              ================================================= */}

          <div
            className={`alert-action-card alert-clickable ${
              dashboardAlerts.due_soon_count > 0
                ? "alert-warning"
                : "alert-safe"
            }`}
            onClick={goToPayments}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {

              if (
                event.key === "Enter" ||
                event.key === " "
              ) {

                event.preventDefault();

                goToPayments();

              }

            }}
          >

            <div className="alert-card-icon">

              {dashboardAlerts.due_soon_count > 0 ? (

                <CalendarClock size={22} />

              ) : (

                <CheckCircle2 size={22} />

              )}

            </div>


            <div className="alert-card-content">

              <h3>
                Due in Next 7 Days
              </h3>


              <div className="alert-card-number">

                {dashboardAlerts.due_soon_count}

              </div>


              <p>

                {dashboardAlerts.due_soon_count > 0

                  ? `${formatCurrency(
                      dashboardAlerts.due_soon_amount
                    )} expected`

                  : "No payments due soon"}

              </p>

            </div>

          </div>


          {/* =================================================
              OVERALL STATUS
              ================================================= */}

          <div
            className={`alert-action-card ${
              dashboardAlerts.total_alerts > 0
                ? "alert-info"
                : "alert-safe"
            }`}
          >

            <div className="alert-card-icon">

              {dashboardAlerts.total_alerts > 0 ? (

                <Bell size={22} />

              ) : (

                <CheckCircle2 size={22} />

              )}

            </div>


            <div className="alert-card-content">

              <h3>
                Overall Status
              </h3>


              <div className="alert-status-text">

                {dashboardAlerts.total_alerts > 0
                  ? "Attention Needed"
                  : "All Clear"}

              </div>


              <p>

                {dashboardAlerts.total_alerts > 0
                  ? "Review the alerts above."
                  : "Nothing requires immediate attention."}

              </p>

            </div>

          </div>


        </div>

      </section>


      {/* =================================================
          CHARTS
          ================================================= */}

      <section className="charts-section">


        {/* =================================================
            LOAN STATUS CHART
            ================================================= */}

        <div className="chart-card">

          <div className="chart-card-header">

            <div>

              <h2>
                Loan Status Distribution
              </h2>

              <p>
                Current distribution of loans
                by status.
              </p>

            </div>

          </div>


          <div className="chart-container">

            {loanStatusData.length === 0 ? (

              <div className="chart-empty">

                No loan status data available.

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <PieChart>

                  <Pie
                    data={loanStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    dataKey="value"
                    nameKey="name"
                    label
                  >

                    {loanStatusData.map(
                      (entry, index) => (

                        <Cell
                          key={`cell-${index}`}
                          fill={
                            chartColors[
                              index %
                              chartColors.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>


        {/* =================================================
            FINANCIAL CHART
            ================================================= */}

        <div className="chart-card">

          <div className="chart-card-header">

            <div>

              <h2>
                Financial Overview
              </h2>

              <p>
                Comparison of major financial
                amounts.
              </p>

            </div>

          </div>


          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height={320}
            >

              <BarChart
                data={financialData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 10,
                  bottom: 20,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="name"
                />

                <YAxis />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />

                <Bar
                  dataKey="amount"
                  fill="#2563eb"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* =================================================
            PAYMENT COLLECTION CHART
            ================================================= */}

        <div className="chart-card chart-card-wide">

          <div className="chart-card-header">

            <div>

              <h2>
                Payment Collection by Method
              </h2>

              <p>
                Total payments collected through
                each payment method.
              </p>

            </div>

          </div>


          <div className="chart-container">

            {collectionData.length === 0 ? (

              <div className="chart-empty">

                No payment collection data
                available.

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={320}
              >

                <BarChart
                  data={collectionData}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 20,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="name"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Bar
                    dataKey="amount"
                    fill="#16a34a"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            )}

          </div>

        </div>

      </section>


      {/* =================================================
          REPAYMENT STATUS
          ================================================= */}

      <section className="section-heading">

        <div>

          <h2>
            Repayment Status
          </h2>

          <p>
            Current repayment progress across
            all loans.
          </p>

        </div>

      </section>


      <section className="repayment-card">

        <div className="repayment-top">

          <div>

            <span className="repayment-label">

              Overall Repayment Progress

            </span>

            <strong>

              {Number(
                summary.repayment_progress || 0
              ).toFixed(2)}

              %

            </strong>

          </div>


          <div className="overdue-count">

            <AlertTriangle size={18} />

            <span>

              {summary.overdue_installments || 0}
              {" "}
              overdue

            </span>

          </div>

        </div>


        <div className="progress-container">

          <div
            className="progress-bar"
            style={{
              width: `${Math.min(
                Number(
                  summary.repayment_progress || 0
                ),
                100
              )}%`,
            }}
          ></div>

        </div>


        <div className="repayment-footer">

          <span>

            Collected:
            {" "}
            {formatCurrency(
              summary.total_collected
            )}

          </span>

          <span>

            Outstanding:
            {" "}
            {formatCurrency(
              summary.outstanding_amount
            )}

          </span>

        </div>

      </section>


      {/* =================================================
          UPCOMING PAYMENTS
          ================================================= */}

      <section className="content-card">

        <div className="content-card-header">

          <div>

            <h2>

              <CalendarDays size={22} />

              Upcoming Payments

            </h2>

            <p>

              Payments due within the selected
              period.

            </p>

          </div>


          <div className="payment-filter-controls">

            <label htmlFor="payment-days">

              Show:

            </label>

            <select
              id="payment-days"
              value={paymentDays}
              onChange={(event) =>
                setPaymentDays(
                  Number(
                    event.target.value
                  )
                )
              }
            >

              <option value={7}>
                Next 7 Days
              </option>

              <option value={30}>
                Next 30 Days
              </option>

              <option value={60}>
                Next 60 Days
              </option>

            </select>


            <span className="count-badge">

              {upcomingPayments.length}

            </span>

          </div>

        </div>


        {upcomingPayments.length === 0 ? (

          <div className="empty-state">

            <CalendarDays size={40} />

            <p>

              No upcoming payments in the
              selected period.

            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="professional-table">

              <thead>

                <tr>

                  <th>Customer</th>
                  <th>Loan ID</th>
                  <th>Installment</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>

                </tr>

              </thead>


              <tbody>

                {upcomingPayments.map(
                  (payment) => (

                    <tr
                      key={
                        payment.installment_id
                      }
                    >

                      <td>

                        <strong>

                          {payment.customer_name}

                        </strong>

                      </td>

                      <td>

                        #{payment.loan_id}

                      </td>

                      <td>

                        #{payment.installment_number}

                      </td>

                      <td>

                        {payment.due_date}

                      </td>

                      <td>

                        {formatCurrency(
                          payment.total_amount
                        )}

                      </td>

                      <td>

                        {formatCurrency(
                          payment.paid_amount
                        )}

                      </td>

                      <td>

                        <strong>

                          {formatCurrency(
                            payment.remaining_amount
                          )}

                        </strong>

                      </td>

                      <td>

                        <span className="status-badge pending">

                          {payment.status}

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          OVERDUE PAYMENTS
          ================================================= */}

      <section className="content-card">

        <div className="content-card-header">

          <div>

            <h2>

              <AlertTriangle size={22} />

              Overdue Payments

            </h2>

            <p>

              Installments that have passed
              their due date.

            </p>

          </div>


          <span
            className={
              overduePayments.length > 0
                ? "count-badge danger"
                : "count-badge success"
            }
          >

            {overduePayments.length}

          </span>

        </div>


        {overduePayments.length === 0 ? (

          <div className="empty-state success-state">

            <CheckCircle size={40} />

            <p>

              No overdue payments. 🎉

            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="professional-table">

              <thead>

                <tr>

                  <th>Customer</th>
                  <th>Loan ID</th>
                  <th>Installment</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Days Overdue</th>
                  <th>Status</th>

                </tr>

              </thead>


              <tbody>

                {overduePayments.map(
                  (payment) => (

                    <tr
                      key={
                        payment.installment_id
                      }
                    >

                      <td>

                        <strong>

                          {payment.customer_name}

                        </strong>

                      </td>

                      <td>

                        #{payment.loan_id}

                      </td>

                      <td>

                        #{payment.installment_number}

                      </td>

                      <td>

                        {payment.due_date}

                      </td>

                      <td>

                        {formatCurrency(
                          payment.total_amount
                        )}

                      </td>

                      <td>

                        {formatCurrency(
                          payment.paid_amount
                        )}

                      </td>

                      <td>

                        <strong>

                          {formatCurrency(
                            payment.remaining_amount
                          )}

                        </strong>

                      </td>

                      <td>

                        <span className="overdue-days">

                          {payment.overdue_days}
                          {" "}
                          days

                        </span>

                      </td>

                      <td>

                        <span className="status-badge overdue">

                          {payment.status}

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =================================================
          PAYMENT COLLECTION SUMMARY
          ================================================= */}

      <section className="content-card">

        <div className="content-card-header">

          <div>

            <h2>

              <Banknote size={22} />

              Payment Collection Summary

            </h2>

            <p>

              Total collections grouped by
              payment method.

            </p>

          </div>


          <span className="count-badge">

            {paymentCollections.length}

          </span>

        </div>


        {paymentCollections.length === 0 ? (

          <div className="empty-state">

            <Banknote size={40} />

            <p>

              No payment collections recorded.

            </p>

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="professional-table">

              <thead>

                <tr>

                  <th>Payment Method</th>
                  <th>Total Collected</th>

                </tr>

              </thead>


              <tbody>

                {paymentCollections.map(
                  (collection) => (

                    <tr
                      key={
                        collection.payment_method
                      }
                    >

                      <td>

                        <strong>

                          {collection.payment_method}

                        </strong>

                      </td>

                      <td>

                        <strong>

                          {formatCurrency(
                            collection.total_collected
                          )}

                        </strong>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


    </div>

  );

}


export default Dashboard;
