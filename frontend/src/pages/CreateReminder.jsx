import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle,
  FileText,
  RefreshCw,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function CreateReminder() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customer_id: "",
    loan_id: "",
    reminder_type: "payment_due",
    message: "",
    reminder_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("access_token")
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const customerId = Number(formData.customer_id);
    const loanId = formData.loan_id
      ? Number(formData.loan_id)
      : null;

    if (!formData.customer_id || customerId <= 0) {
      setError("Please enter a valid customer ID.");
      return;
    }

    if (formData.loan_id && loanId <= 0) {
      setError("Please enter a valid loan ID.");
      return;
    }

    if (!formData.reminder_type.trim()) {
      setError("Please select a reminder type.");
      return;
    }

    if (!formData.reminder_date) {
      setError("Please select a reminder date.");
      return;
    }

    if (!formData.message.trim()) {
      setError("Please enter a reminder message.");
      return;
    }

    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        setError(
          "Authentication token not found. Please login again."
        );
        return;
      }

      const payload = {
        customer_id: customerId,
        loan_id: loanId,
        reminder_type: formData.reminder_type.trim(),
        message: formData.message.trim(),
        reminder_date: formData.reminder_date,
      };

      const response = await fetch(`${API_URL}/reminders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Unable to create reminder."
        );
      }

      setSuccessMessage(
        `Reminder #${data.id} created successfully.`
      );

      setFormData({
        customer_id: "",
        loan_id: "",
        reminder_type: "payment_due",
        message: "",
        reminder_date: "",
      });

      setTimeout(() => {
        navigate(`/reminders/${data.id}`);
      }, 900);
    } catch (err) {
      console.error("Create reminder error:", err);

      setError(
        err.message || "Unable to create reminder."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-reminder-page">

      <div className="create-reminder-header">
        <div>
          <Link
            to="/reminders"
            className="create-reminder-back-link"
          >
            <ArrowLeft size={17} />
            Back to Reminders
          </Link>

          <div className="create-reminder-title-row">
            <div className="create-reminder-title-icon">
              <Bell size={23} />
            </div>

            <div>
              <h1>Create Reminder</h1>
              <p>
                Create a new payment reminder or follow-up.
              </p>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="create-reminder-success">
          <CheckCircle size={19} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="create-reminder-error">
          <XCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      <form
        className="create-reminder-card"
        onSubmit={handleSubmit}
      >
        <div className="create-reminder-card-header">
          <div className="create-reminder-card-icon">
            <FileText size={19} />
          </div>

          <div>
            <h2>Reminder Information</h2>
            <p>
              Enter the details for the new reminder.
            </p>
          </div>
        </div>

        <div className="create-reminder-form-grid">

          <div className="create-reminder-form-group">
            <label htmlFor="customer_id">
              Customer ID
              <span>*</span>
            </label>

            <div className="create-reminder-input-wrapper">
              <User size={17} />

              <input
                id="customer_id"
                name="customer_id"
                type="number"
                min="1"
                placeholder="Enter customer ID"
                value={formData.customer_id}
                onChange={handleChange}
              />
            </div>

            <small>
              Enter the ID of the customer for this reminder.
            </small>
          </div>

          <div className="create-reminder-form-group">
            <label htmlFor="loan_id">
              Loan ID
              <span className="optional-label">
                Optional
              </span>
            </label>

            <div className="create-reminder-input-wrapper">
              <Wallet size={17} />

              <input
                id="loan_id"
                name="loan_id"
                type="number"
                min="1"
                placeholder="Enter loan ID"
                value={formData.loan_id}
                onChange={handleChange}
              />
            </div>

            <small>
              Leave empty for a general customer reminder.
            </small>
          </div>

          <div className="create-reminder-form-group">
            <label htmlFor="reminder_type">
              Reminder Type
              <span>*</span>
            </label>

            <div className="create-reminder-input-wrapper">
              <Bell size={17} />

              <select
                id="reminder_type"
                name="reminder_type"
                value={formData.reminder_type}
                onChange={handleChange}
              >
                <option value="payment_due">
                  Payment Due
                </option>

                <option value="payment_overdue">
                  Payment Overdue
                </option>

                <option value="payment_followup">
                  Payment Follow-up
                </option>

                <option value="loan_followup">
                  Loan Follow-up
                </option>

                <option value="general">
                  General
                </option>
              </select>
            </div>
          </div>

          <div className="create-reminder-form-group">
            <label htmlFor="reminder_date">
              Reminder Date
              <span>*</span>
            </label>

            <div className="create-reminder-input-wrapper">
              <CalendarDays size={17} />

              <input
                id="reminder_date"
                name="reminder_date"
                type="date"
                value={formData.reminder_date}
                onChange={handleChange}
              />
            </div>

            <small>
              Select the date when the reminder should be followed up.
            </small>
          </div>

          <div className="create-reminder-form-group full-width">
            <label htmlFor="message">
              Reminder Message
              <span>*</span>
            </label>

            <div className="create-reminder-textarea-wrapper">
              <FileText size={17} />

              <textarea
                id="message"
                name="message"
                rows="5"
                placeholder="Enter the reminder message..."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <small>
              Write a clear message for the customer follow-up.
            </small>
          </div>

        </div>

        <div className="create-reminder-actions">

          <Link
            to="/reminders"
            className="create-reminder-cancel-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="create-reminder-submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw
                  size={17}
                  className="reminder-spin"
                />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle size={17} />
                Create Reminder
              </>
            )}
          </button>

        </div>
      </form>
    </div>
  );
}

export default CreateReminder;
