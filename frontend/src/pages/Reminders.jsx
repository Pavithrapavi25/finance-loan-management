import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =  import.meta.env.VITE_API_URL ||"http://127.0.0.1:8000";

function Reminders() {
  const [reminders, setReminders] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [sortOption, setSortOption] = useState("priority");

  // =========================================================
  // PART 14 - REFRESH STATE
  // =========================================================

  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(true);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =========================================================
  // PART 11 - CALENDAR
  // =========================================================

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token")
    );
  };

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // =========================================================
  // FETCH REMINDERS
  // =========================================================

  const fetchReminders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_URL}/reminders`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reminders.");
      }

      const data = await response.json();

      setReminders(data);
      setLastUpdated(new Date());

      return data;
    } catch (err) {
      setError(
        err.message || "Unable to load reminders."
      );

      return [];
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // =========================================================
  // AUTOMATIC REMINDER GENERATION
  // =========================================================

  const generateUpcomingReminders = async (
    showMessage = false
  ) => {
    try {
      if (showMessage) {
        setGenerating(true);
      } else {
        setAutoGenerating(true);
      }

      setError("");

      const response = await fetch(
        `${API_URL}/reminders/generate-upcoming?days_ahead=3`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to generate upcoming reminders."
        );
      }

      const data = await response.json();

      if (showMessage) {
        setSuccessMessage(
          `${data.length} upcoming reminder${
            data.length === 1 ? "" : "s"
          } generated.`
        );

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }

      return data;
    } catch (err) {
      setError(
        err.message ||
          "Unable to generate upcoming reminders."
      );

      return [];
    } finally {
      if (showMessage) {
        setGenerating(false);
      } else {
        setAutoGenerating(false);
      }
    }
  };

  // =========================================================
  // AUTOMATIC GENERATION WHEN PAGE OPENS
  // =========================================================

  useEffect(() => {
    const initializeReminders = async () => {
      try {
        setAutoGenerating(true);
        setError("");

        await generateUpcomingReminders(false);
        await fetchReminders(true);
      } catch (err) {
        setError(
          err.message ||
            "Unable to initialize reminders."
        );
      } finally {
        setAutoGenerating(false);
      }
    };

    initializeReminders();
  }, []);

  // =========================================================
  // PART 14 - AUTOMATIC BACKGROUND REFRESH
  // =========================================================

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchReminders(false);
    }, 60000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // =========================================================
  // MANUAL GENERATE
  // =========================================================

  const handleGenerateUpcoming = async () => {
    setSuccessMessage("");
    setError("");

    const generatedReminders =
      await generateUpcomingReminders(true);

    if (generatedReminders.length === 0) {
      setSuccessMessage(
        "No new upcoming reminders were needed."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    }

    await fetchReminders(false);
  };

  // =========================================================
  // PART 14 - MANUAL REFRESH
  // =========================================================

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    try {
      setIsRefreshing(true);
      setError("");

      await fetchReminders(false);

      setSuccessMessage(
        "Reminders refreshed successfully."
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // DATE-ONLY HELPER
  // =========================================================

  const getDateOnly = (dateValue) => {
    if (!dateValue) {
      return null;
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    date.setHours(0, 0, 0, 0);

    return date;
  };

  // =========================================================
  // REMINDER STATUS
  // =========================================================

  const getReminderStatus = (reminder) => {
    if (reminder.is_sent) {
      return "sent";
    }

    if (!reminder.reminder_date) {
      return "pending";
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const reminderDate = getDateOnly(
      reminder.reminder_date
    );

    if (!reminderDate) {
      return "pending";
    }

    if (reminderDate < today) {
      return "overdue";
    }

    return "pending";
  };

  // =========================================================
  // REMINDER PRIORITY
  // =========================================================

  const getReminderPriority = (reminder) => {
    if (reminder.is_sent) {
      return "completed";
    }

    if (!reminder.reminder_date) {
      return "upcoming";
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const reminderDate = getDateOnly(
      reminder.reminder_date
    );

    if (!reminderDate) {
      return "upcoming";
    }

    const differenceInMs =
      reminderDate.getTime() -
      today.getTime();

    const differenceInDays = Math.round(
      differenceInMs /
        (1000 * 60 * 60 * 24)
    );

    if (differenceInDays < 0) {
      return "overdue";
    }

    if (differenceInDays === 0) {
      return "today";
    }

    if (differenceInDays === 1) {
      return "tomorrow";
    }

    return "upcoming";
  };

  // =========================================================
  // PRIORITY LABEL
  // =========================================================

  const getPriorityLabel = (priority) => {
    if (priority === "overdue") {
      return "Overdue";
    }

    if (priority === "today") {
      return "Due Today";
    }

    if (priority === "tomorrow") {
      return "Due Tomorrow";
    }

    if (priority === "completed") {
      return "Completed";
    }

    return "Upcoming";
  };

  // =========================================================
  // PRIORITY CSS CLASS
  // =========================================================

  const getPriorityClass = (priority) => {
    if (priority === "overdue") {
      return "reminder-priority reminder-priority-overdue";
    }

    if (priority === "today") {
      return "reminder-priority reminder-priority-today";
    }

    if (priority === "tomorrow") {
      return "reminder-priority reminder-priority-tomorrow";
    }

    if (priority === "completed") {
      return "reminder-priority reminder-priority-completed";
    }

    return "reminder-priority reminder-priority-upcoming";
  };

  // =========================================================
  // STATUS LABEL
  // =========================================================

  const getStatusLabel = (status) => {
    if (status === "sent") {
      return "Sent";
    }

    if (status === "overdue") {
      return "Overdue";
    }

    return "Pending";
  };

  // =========================================================
  // STATUS CSS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "sent") {
      return "reminder-status reminder-status-sent";
    }

    if (status === "overdue") {
      return "reminder-status reminder-status-overdue";
    }

    return "reminder-status reminder-status-pending";
  };

  // =========================================================
  // PART 9 - FILTER REMINDERS
  // =========================================================

  const filteredReminders = reminders.filter(
    (reminder) => {
      const status =
        getReminderStatus(reminder);

      const priority =
        getReminderPriority(reminder);

      const searchValue =
        searchTerm.toLowerCase().trim();

      const matchesSearch =
        String(reminder.id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reminder.customer_id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reminder.loan_id || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reminder.reminder_type || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(reminder.message || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    }
  );

  // =========================================================
  // PART 9 - SORTING
  // =========================================================

  const sortedReminders = [
    ...filteredReminders,
  ].sort((a, b) => {
    if (sortOption === "oldest") {
      return (
        new Date(a.reminder_date || 0) -
        new Date(b.reminder_date || 0)
      );
    }

    if (sortOption === "newest") {
      return (
        new Date(b.reminder_date || 0) -
        new Date(a.reminder_date || 0)
      );
    }

    if (sortOption === "customer") {
      return (
        Number(a.customer_id || 0) -
        Number(b.customer_id || 0)
      );
    }

    const priorityOrder = {
      overdue: 1,
      today: 2,
      tomorrow: 3,
      upcoming: 4,
      completed: 5,
    };

    return (
      (priorityOrder[
        getReminderPriority(a)
      ] || 99) -
      (priorityOrder[
        getReminderPriority(b)
      ] || 99)
    );
  });

  // =========================================================
  // PART 10 - SUMMARY COUNTS
  // =========================================================

  const totalCount = reminders.length;

  const sentCount = reminders.filter(
    (reminder) =>
      getReminderStatus(reminder) === "sent"
  ).length;

  const pendingCount = reminders.filter(
    (reminder) =>
      getReminderStatus(reminder) === "pending"
  ).length;

  const overdueCount = reminders.filter(
    (reminder) =>
      getReminderStatus(reminder) === "overdue"
  ).length;

  const dueTodayCount = reminders.filter(
    (reminder) =>
      getReminderPriority(reminder) === "today"
  ).length;

  const dueTomorrowCount = reminders.filter(
    (reminder) =>
      getReminderPriority(reminder) === "tomorrow"
  ).length;

  const upcomingCount = reminders.filter(
    (reminder) =>
      getReminderPriority(reminder) === "upcoming"
  ).length;

  const completedCount = reminders.filter(
    (reminder) =>
      getReminderPriority(reminder) === "completed"
  ).length;

  const pendingPercentage =
    totalCount > 0
      ? Math.round(
          (pendingCount / totalCount) * 100
        )
      : 0;

  const sentPercentage =
    totalCount > 0
      ? Math.round(
          (sentCount / totalCount) * 100
        )
      : 0;

  const overduePercentage =
    totalCount > 0
      ? Math.round(
          (overdueCount / totalCount) * 100
        )
      : 0;

  const todayWorkloadPercentage =
    totalCount > 0
      ? Math.round(
          (dueTodayCount / totalCount) * 100
        )
      : 0;

  const upcomingWorkload =
    dueTomorrowCount + upcomingCount;

  const upcomingWorkloadPercentage =
    totalCount > 0
      ? Math.round(
          (upcomingWorkload / totalCount) * 100
        )
      : 0;

  // =========================================================
  // PART 12 - NOTIFICATION COUNTS
  // =========================================================

  const notificationOverdueCount =
    reminders.filter(
      (reminder) =>
        !reminder.is_sent &&
        getReminderPriority(reminder) ===
          "overdue"
    ).length;

  const notificationTodayCount =
    reminders.filter(
      (reminder) =>
        !reminder.is_sent &&
        getReminderPriority(reminder) ===
          "today"
    ).length;

  const notificationTomorrowCount =
    reminders.filter(
      (reminder) =>
        !reminder.is_sent &&
        getReminderPriority(reminder) ===
          "tomorrow"
    ).length;

  const notificationUpcomingCount =
    reminders.filter(
      (reminder) =>
        !reminder.is_sent &&
        getReminderPriority(reminder) ===
          "upcoming"
    ).length;

  const totalPendingNotifications =
    notificationOverdueCount +
    notificationTodayCount +
    notificationTomorrowCount +
    notificationUpcomingCount;

  // =========================================================
  // PART 12 - NOTIFICATION FILTER
  // =========================================================

  const applyNotificationFilter = (priority) => {
    setStatusFilter("pending");
    setPriorityFilter(priority);
  };

  // =========================================================
  // PART 11 - CALENDAR HELPERS
  // =========================================================

  const formatCalendarDate = (date) => {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getCalendarMonthName = (date) => {
    return date.toLocaleString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  const getCalendarDays = () => {
    const year =
      calendarDate.getFullYear();

    const month =
      calendarDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    const startingDay =
      firstDay.getDay();

    const totalDays =
      lastDay.getDate();

    const days = [];

    for (
      let index = 0;
      index < startingDay;
      index++
    ) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      days.push(
        new Date(
          year,
          month,
          day
        )
      );
    }

    return days;
  };

  const getRemindersForDate = (date) => {
    if (!date) {
      return [];
    }

    const targetDate =
      formatCalendarDate(date);

    return reminders.filter(
      (reminder) => {
        if (!reminder.reminder_date) {
          return false;
        }

        return (
          reminder.reminder_date.substring(
            0,
            10
          ) === targetDate
        );
      }
    );
  };

  const goToPreviousMonth = () => {
    setCalendarDate(
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() - 1,
        1
      )
    );
  };

  const goToNextMonth = () => {
    setCalendarDate(
      new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth() + 1,
        1
      )
    );
  };

  const goToCurrentMonth = () => {
    setCalendarDate(new Date());
  };

  // =========================================================
  // PART 12 - CALENDAR REMINDER CLASS
  // =========================================================

  const getCalendarReminderClass = (
    reminder
  ) => {
    const priority =
      getReminderPriority(reminder);

    if (priority === "overdue") {
      return "reminder-calendar-reminder reminder-calendar-overdue";
    }

    if (priority === "today") {
      return "reminder-calendar-reminder reminder-calendar-today";
    }

    if (priority === "tomorrow") {
      return "reminder-calendar-reminder reminder-calendar-tomorrow";
    }

    if (priority === "completed") {
      return "reminder-calendar-reminder reminder-calendar-completed";
    }

    return "reminder-calendar-reminder reminder-calendar-upcoming";
  };

  // =========================================================
  // PART 13 - CSV ESCAPE HELPER
  // =========================================================

  const escapeCSVValue = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const stringValue = String(value);

    return `"${stringValue.replace(
      /"/g,
      '""'
    )}"`;
  };

  // =========================================================
  // PART 13 - EXPORT FILTERED REMINDERS
  // =========================================================

  const handleExportCSV = () => {
    if (sortedReminders.length === 0) {
      setError(
        "There are no reminders to export."
      );
      return;
    }

    try {
      const headers = [
        "Reminder ID",
        "Customer ID",
        "Loan ID",
        "Reminder Type",
        "Reminder Date",
        "Priority",
        "Message",
        "Status",
        "Is Sent",
      ];

      const rows = sortedReminders.map(
        (reminder) => {
          const priority =
            getReminderPriority(
              reminder
            );

          const status =
            getReminderStatus(
              reminder
            );

          return [
            reminder.id,
            reminder.customer_id,
            reminder.loan_id || "",
            reminder.reminder_type || "",
            reminder.reminder_date
              ? formatDate(
                  reminder.reminder_date
                )
              : "",
            getPriorityLabel(priority),
            reminder.message || "",
            getStatusLabel(status),
            reminder.is_sent
              ? "Yes"
              : "No",
          ];
        }
      );

      const csvContent = [
        headers
          .map(escapeCSVValue)
          .join(","),
        ...rows.map((row) =>
          row
            .map(escapeCSVValue)
            .join(",")
        ),
      ].join("\r\n");

      const blob = new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      const today = new Date();

      const datePart =
        today.toISOString().split("T")[0];

      link.download =
        `reminders-${datePart}.csv`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      setError("");

      setSuccessMessage(
        `${sortedReminders.length} reminder${
          sortedReminders.length === 1
            ? ""
            : "s"
        } exported successfully.`
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "CSV export error:",
        err
      );

      setError(
        "Unable to export reminders."
      );
    }
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSortOption("priority");
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="page-container reminders-page">

      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="page-header reminders-page-header">

        <div>
          <h1>Reminders</h1>

          <p>
            Manage upcoming, overdue and
            completed payment reminders.
          </p>

          {/* =================================================
              PART 14 - LAST UPDATED
              ================================================= */}

          {lastUpdated && (
            <div className="reminders-last-updated">
              🕐 Last updated:{" "}
              {lastUpdated.toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }
              )}
            </div>
          )}
        </div>

        <div className="reminders-header-actions">

          <Link
            to="/reminders/create"
            className="reminders-create-button"
          >
            + Create Reminder
          </Link>

          <button
            type="button"
            className="generate-reminders-button"
            onClick={
              handleGenerateUpcoming
            }
            disabled={
              generating ||
              autoGenerating ||
              isRefreshing
            }
          >
            {generating
              ? "Generating..."
              : "Generate Upcoming"}
          </button>

          {/* =================================================
              PART 14 - REFRESH
              ================================================= */}

          <button
            type="button"
            className="reminders-refresh-button"
            onClick={handleRefresh}
            disabled={
              isRefreshing ||
              loading
            }
          >
            {isRefreshing
              ? "⏳ Refreshing..."
              : "🔄 Refresh"}
          </button>

          {/* =================================================
              PART 13 - EXPORT
              ================================================= */}

          <button
            type="button"
            className="reminders-export-button"
            onClick={handleExportCSV}
            disabled={
              sortedReminders.length === 0 ||
              loading ||
              autoGenerating ||
              isRefreshing
            }
            title={
              sortedReminders.length === 0
                ? "No reminders available to export"
                : "Export currently displayed reminders"
            }
          >
            ↓ Export CSV
          </button>

        </div>
      </div>

      {/* =====================================================
          AUTOMATIC GENERATION MESSAGE
          ===================================================== */}

      {autoGenerating && (
        <div className="reminders-auto-message">
          Checking for upcoming payment
          reminders...
        </div>
      )}

      {/* =====================================================
          SUCCESS MESSAGE
          ===================================================== */}

      {successMessage && (
        <div className="reminders-success-message">
          {successMessage}
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
          ===================================================== */}

      {error && (
        <div className="reminders-error-message">
          {error}
        </div>
      )}

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="reminders-summary-grid">

        <div className="reminder-summary-card">
          <div className="reminder-summary-label">
            Total
          </div>

          <div className="reminder-summary-value">
            {totalCount}
          </div>
        </div>

        <div className="reminder-summary-card reminder-summary-pending">
          <div className="reminder-summary-label">
            Pending
          </div>

          <div className="reminder-summary-value">
            {pendingCount}
          </div>
        </div>

        <div className="reminder-summary-card reminder-summary-overdue">
          <div className="reminder-summary-label">
            Overdue
          </div>

          <div className="reminder-summary-value">
            {overdueCount}
          </div>
        </div>

        <div className="reminder-summary-card reminder-summary-sent">
          <div className="reminder-summary-label">
            Sent
          </div>

          <div className="reminder-summary-value">
            {sentCount}
          </div>
        </div>

        <div className="reminder-summary-card reminder-summary-today">
          <div className="reminder-summary-label">
            Due Today
          </div>

          <div className="reminder-summary-value">
            {dueTodayCount}
          </div>
        </div>

        <div className="reminder-summary-card reminder-summary-tomorrow">
          <div className="reminder-summary-label">
            Due Tomorrow
          </div>

          <div className="reminder-summary-value">
            {dueTomorrowCount}
          </div>
        </div>

      </div>

      {/* =====================================================
          PART 10 - REMINDER STATISTICS
          ===================================================== */}

      <div className="reminder-statistics-card">

        <div className="reminder-statistics-header">

          <div>
            <h2>Reminder Statistics</h2>

            <p>
              Quick overview of reminder
              workload and completion.
            </p>
          </div>

        </div>

        <div className="reminder-statistics-grid">

          <div className="reminder-statistics-item">
            <div className="reminder-statistics-icon">
              📋
            </div>

            <div className="reminder-statistics-content">
              <span>Total Reminders</span>

              <strong>
                {totalCount}
              </strong>
            </div>
          </div>

          <div className="reminder-statistics-item">
            <div className="reminder-statistics-icon">
              ⏳
            </div>

            <div className="reminder-statistics-content">
              <span>Pending</span>

              <strong>
                {pendingPercentage}%
              </strong>
            </div>
          </div>

          <div className="reminder-statistics-item">
            <div className="reminder-statistics-icon">
              ✓
            </div>

            <div className="reminder-statistics-content">
              <span>Sent</span>

              <strong>
                {sentPercentage}%
              </strong>
            </div>
          </div>

          <div className="reminder-statistics-item">
            <div className="reminder-statistics-icon">
              ⚠
            </div>

            <div className="reminder-statistics-content">
              <span>Overdue</span>

              <strong>
                {overduePercentage}%
              </strong>
            </div>
          </div>

          <div className="reminder-statistics-item">
            <div className="reminder-statistics-icon">
              📅
            </div>

            <div className="reminder-statistics-content">
              <span>Today's Workload</span>

              <strong>
                {todayWorkloadPercentage}%
              </strong>
            </div>
          </div>

          <div className="reminder-statistics-item">
            <div className="reminder-statistics-icon">
              🔔
            </div>

            <div className="reminder-statistics-content">
              <span>Upcoming Workload</span>

              <strong>
                {upcomingWorkloadPercentage}%
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================
          PART 12 - REMINDER ALERTS
          ===================================================== */}

      <div className="reminder-notification-card">

        <div className="reminder-notification-header">

          <div>
            <h2>🔔 Reminder Alerts</h2>

            <p>
              Pending reminders that require
              attention.
            </p>
          </div>

          <div
            className={
              totalPendingNotifications > 0
                ? "reminder-notification-badge reminder-notification-active"
                : "reminder-notification-badge reminder-notification-clear"
            }
          >
            {totalPendingNotifications}
          </div>

        </div>

        {totalPendingNotifications > 0 ? (
          <div className="reminder-notification-grid">

            <button
              type="button"
              className="reminder-notification-item reminder-notification-overdue"
              onClick={() =>
                applyNotificationFilter(
                  "overdue"
                )
              }
            >
              <span className="reminder-notification-icon">
                ⚠
              </span>

              <span className="reminder-notification-content">

                <span className="reminder-notification-label">
                  Overdue
                </span>

                <strong>
                  {notificationOverdueCount}
                </strong>

                <small>
                  Needs immediate attention
                </small>

              </span>
            </button>

            <button
              type="button"
              className="reminder-notification-item reminder-notification-today"
              onClick={() =>
                applyNotificationFilter(
                  "today"
                )
              }
            >
              <span className="reminder-notification-icon">
                📅
              </span>

              <span className="reminder-notification-content">

                <span className="reminder-notification-label">
                  Due Today
                </span>

                <strong>
                  {notificationTodayCount}
                </strong>

                <small>
                  Payment reminders for today
                </small>

              </span>
            </button>

            <button
              type="button"
              className="reminder-notification-item reminder-notification-tomorrow"
              onClick={() =>
                applyNotificationFilter(
                  "tomorrow"
                )
              }
            >
              <span className="reminder-notification-icon">
                ⏰
              </span>

              <span className="reminder-notification-content">

                <span className="reminder-notification-label">
                  Due Tomorrow
                </span>

                <strong>
                  {notificationTomorrowCount}
                </strong>

                <small>
                  Prepare for tomorrow
                </small>

              </span>
            </button>

            <button
              type="button"
              className="reminder-notification-item reminder-notification-upcoming"
              onClick={() =>
                applyNotificationFilter(
                  "upcoming"
                )
              }
            >
              <span className="reminder-notification-icon">
                🔔
              </span>

              <span className="reminder-notification-content">

                <span className="reminder-notification-label">
                  Upcoming
                </span>

                <strong>
                  {notificationUpcomingCount}
                </strong>

                <small>
                  Upcoming pending reminders
                </small>

              </span>
            </button>

          </div>
        ) : (
          <div className="reminder-notification-success">
            ✓ All reminders are currently
            up to date.
          </div>
        )}

      </div>

      {/* =====================================================
          PART 11 - CALENDAR
          ===================================================== */}

      <div className="reminder-calendar-card">

        <div className="reminder-calendar-header">

          <div>
            <h2>Reminder Calendar</h2>

            <p>
              View reminders by scheduled date.
            </p>
          </div>

          <button
            type="button"
            className="reminder-calendar-toggle"
            onClick={() =>
              setShowCalendar(
                !showCalendar
              )
            }
          >
            {showCalendar
              ? "Hide Calendar"
              : "Show Calendar"}
          </button>

        </div>

        {showCalendar && (
          <div className="reminder-calendar">

            <div className="reminder-calendar-navigation">

              <button
                type="button"
                onClick={
                  goToPreviousMonth
                }
                className="reminder-calendar-nav-button"
              >
                ←
              </button>

              <div className="reminder-calendar-month">
                {getCalendarMonthName(
                  calendarDate
                )}
              </div>

              <button
                type="button"
                onClick={
                  goToNextMonth
                }
                className="reminder-calendar-nav-button"
              >
                →
              </button>

              <button
                type="button"
                onClick={
                  goToCurrentMonth
                }
                className="reminder-calendar-current-button"
              >
                Current Month
              </button>

            </div>

            <div className="reminder-calendar-weekdays">

              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div
                  key={day}
                  className="reminder-calendar-weekday"
                >
                  {day}
                </div>
              ))}

            </div>

            <div className="reminder-calendar-grid">

              {getCalendarDays().map(
                (date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="reminder-calendar-day reminder-calendar-empty"
                      />
                    );
                  }

                  const dayReminders =
                    getRemindersForDate(
                      date
                    );

                  const today =
                    new Date();

                  today.setHours(
                    0,
                    0,
                    0,
                    0
                  );

                  const isToday =
                    date.getTime() ===
                    today.getTime();

                  return (
                    <div
                      key={date.toISOString()}
                      className={
                        isToday
                          ? "reminder-calendar-day reminder-calendar-today"
                          : "reminder-calendar-day"
                      }
                    >

                      <div className="reminder-calendar-day-number">
                        {date.getDate()}
                      </div>

                      <div className="reminder-calendar-day-reminders">

                        {dayReminders.map(
                          (reminder) => (
                            <Link
                              key={
                                reminder.id
                              }
                              to={`/reminders/${reminder.id}`}
                              className={getCalendarReminderClass(
                                reminder
                              )}
                              title={
                                reminder.message ||
                                "Reminder"
                              }
                            >
                              #{reminder.id}
                            </Link>
                          )
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

            <div className="reminder-calendar-legend">

              <span>
                <i className="legend-dot legend-overdue" />
                Overdue
              </span>

              <span>
                <i className="legend-dot legend-today" />
                Today
              </span>

              <span>
                <i className="legend-dot legend-tomorrow" />
                Tomorrow
              </span>

              <span>
                <i className="legend-dot legend-upcoming" />
                Upcoming
              </span>

              <span>
                <i className="legend-dot legend-completed" />
                Completed
              </span>

            </div>

          </div>
        )}

      </div>

      {/* =====================================================
          SEARCH + FILTERS + SORT
          ===================================================== */}

      <div className="reminders-toolbar">

        <div className="reminders-search-wrapper">

          <input
            type="text"
            placeholder="Search reminders..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            className="reminders-search-input"
          />

        </div>

        <div className="reminders-filter-wrapper">

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="reminders-status-filter"
          >

            <option value="all">
              All Statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="overdue">
              Overdue
            </option>

            <option value="sent">
              Sent
            </option>

          </select>

        </div>

        <div className="reminders-filter-wrapper">

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(
                event.target.value
              )
            }
            className="reminders-priority-filter"
          >

            <option value="all">
              All Priorities
            </option>

            <option value="overdue">
              Overdue
            </option>

            <option value="today">
              Due Today
            </option>

            <option value="tomorrow">
              Due Tomorrow
            </option>

            <option value="upcoming">
              Upcoming
            </option>

            <option value="completed">
              Completed
            </option>

          </select>

        </div>

        <div className="reminders-sort-filter">

          <select
            value={sortOption}
            onChange={(event) =>
              setSortOption(
                event.target.value
              )
            }
            className="reminders-sort-select"
          >

            <option value="priority">
              Sort: Priority
            </option>

            <option value="oldest">
              Sort: Oldest
            </option>

            <option value="newest">
              Sort: Newest
            </option>

            <option value="customer">
              Sort: Customer
            </option>

          </select>

        </div>

        <button
          type="button"
          className="reminders-clear-filters-button"
          onClick={
            handleClearFilters
          }
        >
          Clear Filters
        </button>

      </div>

      {/* =====================================================
          FILTER RESULT SUMMARY
          ===================================================== */}

      <div className="reminders-result-summary">

        Showing{" "}

        <strong>
          {sortedReminders.length}
        </strong>{" "}

        of{" "}

        <strong>
          {totalCount}
        </strong>{" "}

        reminders

        {sortOption === "priority" && (
          <span className="reminders-sort-active-label">
            {" "}
            • Sorted by priority
          </span>
        )}

        {sortOption === "oldest" && (
          <span className="reminders-sort-active-label">
            {" "}
            • Sorted oldest first
          </span>
        )}

        {sortOption === "newest" && (
          <span className="reminders-sort-active-label">
            {" "}
            • Sorted newest first
          </span>
        )}

        {sortOption === "customer" && (
          <span className="reminders-sort-active-label">
            {" "}
            • Sorted by customer
          </span>
        )}

      </div>

      {/* =====================================================
          REMINDER TABLE
          ===================================================== */}

      <div className="reminders-table-card">

        {loading || autoGenerating ? (
          <div className="reminders-state-message">
            Checking upcoming reminders...
          </div>
        ) : sortedReminders.length === 0 ? (
          <div className="reminders-state-message">
            No reminders found.
          </div>
        ) : (
          <div className="reminders-table-wrapper">

            <table className="reminders-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Loan</th>
                  <th>Type</th>
                  <th>Reminder Date</th>
                  <th>Priority</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {sortedReminders.map(
                  (reminder) => {
                    const status =
                      getReminderStatus(
                        reminder
                      );

                    const priority =
                      getReminderPriority(
                        reminder
                      );

                    return (
                      <tr
                        key={
                          reminder.id
                        }
                      >

                        <td>
                          <Link
                            to={`/reminders/${reminder.id}`}
                            className="reminder-id-link"
                          >
                            #{reminder.id}
                          </Link>
                        </td>

                        <td>
                          #{reminder.customer_id}
                        </td>

                        <td>
                          {reminder.loan_id
                            ? `#${reminder.loan_id}`
                            : "-"}
                        </td>

                        <td>
                          {reminder.reminder_type ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={
                              status ===
                              "overdue"
                                ? "reminder-date overdue-date"
                                : "reminder-date"
                            }
                          >
                            {formatDate(
                              reminder.reminder_date
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={getPriorityClass(
                              priority
                            )}
                          >
                            {getPriorityLabel(
                              priority
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="reminder-message-cell">
                            {reminder.message ||
                              "-"}
                          </div>
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              status
                            )}
                          >

                            <span className="reminder-status-dot">
                              ●
                            </span>

                            {getStatusLabel(
                              status
                            )}

                          </span>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================================
          SMALL HIDDEN REFERENCE COUNTS
          ===================================================== */}

      <div className="reminders-internal-counts">
        {completedCount}
      </div>

    </div>
  );
}

export default Reminders;
