import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle,
  Clock,
  FileText,
  Hash,
  RefreshCw,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

const API_URL =  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function ReminderDetails() {
  const { reminderId } = useParams();

  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token")
    );
  };

  const fetchReminder = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/reminders/${reminderId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to load reminder."
        );
      }

      setReminder(data);
    } catch (err) {
      console.error("Fetch reminder details error:", err);

      setError(
        err.message || "Unable to load reminder details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminder();
  }, [reminderId]);

  // =========================================
  // UPDATE REMINDER STATUS
  // =========================================

  const handleStatusUpdate = async () => {
    if (!reminder) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccessMessage("");

      const token = getToken();

      if (!token) {
        setError(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const newStatus = !reminder.is_sent;

      const response = await fetch(
        `${API_URL}/reminders/${reminderId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_sent: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to update reminder status."
        );
      }

      setReminder(data);

      setSuccessMessage(
        newStatus
          ? "Reminder marked as sent successfully."
          : "Reminder marked as pending successfully."
      );
    } catch (err) {
      console.error("Update reminder status error:", err);

      setError(
        err.message || "Unable to update reminder status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="reminder-details-page">
        <div className="reminder-details-state">
          <RefreshCw
            size={28}
            className="reminder-spin"
          />
          <p>Loading reminder details...</p>
        </div>
      </div>
    );
  }

  if (error && !reminder) {
    return (
      <div className="reminder-details-page">
        <div className="reminder-details-error">
          <XCircle size={32} />

          <h2>Unable to Load Reminder</h2>

          <p>{error}</p>

          <Link
            to="/reminders"
            className="reminder-back-button"
          >
            <ArrowLeft size={17} />
            Back to Reminders
          </Link>
        </div>
      </div>
    );
  }

  if (!reminder) {
    return (
      <div className="reminder-details-page">
        <div className="reminder-details-error">
          <Bell size={32} />

          <h2>Reminder Not Found</h2>

          <p>
            The requested reminder could not be found.
          </p>

          <Link
            to="/reminders"
            className="reminder-back-button"
          >
            <ArrowLeft size={17} />
            Back to Reminders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="reminder-details-page">

      {/* Header */}
      <div className="reminder-details-header">

        <div>
          <Link
            to="/reminders"
            className="reminder-back-link"
          >
            <ArrowLeft size={17} />
            Back to Reminders
          </Link>

          <div className="reminder-details-title-row">

            <div className="reminder-details-icon">
              <Bell size={24} />
            </div>

            <div>
              <h1>Reminder #{reminder.id}</h1>

              <p>
                View complete reminder information and status.
              </p>
            </div>

          </div>
        </div>

        <div className="reminder-details-header-status">
          {reminder.is_sent ? (
            <span className="reminder-details-status sent">
              <CheckCircle size={16} />
              Sent
            </span>
          ) : (
            <span className="reminder-details-status pending">
              <Clock size={16} />
              Pending
            </span>
          )}
        </div>

      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="reminder-details-success-message">
          <CheckCircle size={18} />
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Close success message"
          >
            <XCircle size={17} />
          </button>
        </div>
      )}

      {error && reminder && (
        <div className="reminder-details-error-message">
          <XCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error message"
          >
            <XCircle size={17} />
          </button>
        </div>
      )}

      {/* Main Information */}
      <div className="reminder-details-grid">

        {/* Reminder Information */}
        <div className="reminder-details-card">

          <div className="reminder-details-card-header">

            <div className="reminder-card-header-icon">
              <Bell size={19} />
            </div>

            <div>
              <h2>Reminder Information</h2>
              <p>Basic reminder details</p>
            </div>

          </div>

          <div className="reminder-info-list">

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <Hash size={18} />
              </div>

              <div>
                <span>Reminder ID</span>
                <strong>#{reminder.id}</strong>
              </div>

            </div>

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <FileText size={18} />
              </div>

              <div>
                <span>Reminder Type</span>

                <strong>
                  {reminder.reminder_type || "-"}
                </strong>
              </div>

            </div>

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <CalendarDays size={18} />
              </div>

              <div>
                <span>Reminder Date</span>

                <strong>
                  {formatDate(reminder.reminder_date)}
                </strong>
              </div>

            </div>

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <Clock size={18} />
              </div>

              <div>
                <span>Status</span>

                <strong>
                  {reminder.is_sent
                    ? "Sent"
                    : "Pending"}
                </strong>
              </div>

            </div>

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <CalendarDays size={18} />
              </div>

              <div>
                <span>Created At</span>

                <strong>
                  {formatDateTime(
                    reminder.created_at
                  )}
                </strong>
              </div>

            </div>

          </div>

        </div>

        {/* Customer & Loan */}
        <div className="reminder-details-card">

          <div className="reminder-details-card-header">

            <div className="reminder-card-header-icon">
              <User size={19} />
            </div>

            <div>
              <h2>Related Records</h2>
              <p>Customer and loan information</p>
            </div>

          </div>

          <div className="reminder-info-list">

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <User size={18} />
              </div>

              <div>
                <span>Customer</span>

                <strong>
                  Customer #{reminder.customer_id}
                </strong>
              </div>

            </div>

            <div className="reminder-info-item">

              <div className="reminder-info-icon">
                <Wallet size={18} />
              </div>

              <div>
                <span>Loan</span>

                <strong>
                  {reminder.loan_id
                    ? `Loan #${reminder.loan_id}`
                    : "General Reminder"}
                </strong>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Message */}
      <div className="reminder-details-card reminder-message-card">

        <div className="reminder-details-card-header">

          <div className="reminder-card-header-icon">
            <FileText size={19} />
          </div>

          <div>
            <h2>Reminder Message</h2>
            <p>Message associated with this reminder</p>
          </div>

        </div>

        <div className="reminder-full-message">
          {reminder.message || "No message available."}
        </div>

      </div>

      {/* Status Action */}
      <div className="reminder-status-action-card">

        <div className="reminder-status-action-content">

          <div className="reminder-status-action-icon">
            {reminder.is_sent ? (
              <CheckCircle size={22} />
            ) : (
              <Clock size={22} />
            )}
          </div>

          <div>
            <h3>
              {reminder.is_sent
                ? "Reminder has been sent"
                : "Reminder is pending"}
            </h3>

            <p>
              {reminder.is_sent
                ? "You can move this reminder back to pending if it still requires follow-up."
                : "Once you have contacted the customer, mark this reminder as sent."}
            </p>
          </div>

        </div>

        <button
          type="button"
          className={
            reminder.is_sent
              ? "reminder-status-action-button pending-action"
              : "reminder-status-action-button sent-action"
          }
          onClick={handleStatusUpdate}
          disabled={updatingStatus}
        >
          {updatingStatus ? (
            <>
              <RefreshCw
                size={17}
                className="reminder-spin"
              />
              Updating...
            </>
          ) : reminder.is_sent ? (
            <>
              <Clock size={17} />
              Mark as Pending
            </>
          ) : (
            <>
              <CheckCircle size={17} />
              Mark as Sent
            </>
          )}
        </button>

      </div>

      {/* Bottom Navigation */}
      <div className="reminder-details-footer">

        <Link
          to="/reminders"
          className="reminder-back-button"
        >
          <ArrowLeft size={17} />
          Back to Reminders
        </Link>

      </div>

    </div>
  );
}

export default ReminderDetails;
