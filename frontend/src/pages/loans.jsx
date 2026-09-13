import { useEffect, useState } from "react";
import {
  Search,
  CreditCard,
  IndianRupee,
  Percent,
  CalendarDays,
  Clock,
  Eye,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Loans() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
    principal_amount: "",
    interest_rate: "",
    interest_type: "reducing",
    tenure_months: "",
    start_date: "",
    maturity_date: "",
    purpose: "",
  });

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchLoansAndCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const [loansResponse, customersResponse] =
        await Promise.all([
          api.get("/loans", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          api.get("/customers", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      setLoans(loansResponse.data);
      setCustomers(customersResponse.data);
    } catch (error) {
      console.error(
        "Fetch loans and customers error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Failed to load loans"
        );
      } else {
        setError("Cannot connect to the backend");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLoansAndCustomers();
    }
  }, [token]);

  const getCustomerName = (customerId) => {
    const customer = customers.find(
      (item) => item.id === Number(customerId)
    );

    return customer?.full_name ||
      `Customer #${customerId}`;
  };

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount || 0);

    return numericAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "loan-status active";

      case "completed":
        return "loan-status completed";

      case "pending":
        return "loan-status pending";

      case "cancelled":
        return "loan-status cancelled";

      default:
        return "loan-status";
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      principal_amount: "",
      interest_rate: "",
      interest_type: "reducing",
      tenure_months: "",
      start_date: "",
      maturity_date: "",
      purpose: "",
    });

    setFormError("");
  };

  const handleOpenForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleAddLoan = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      const loanData = {
        customer_id: Number(formData.customer_id),
        principal_amount: Number(
          formData.principal_amount
        ),
        interest_rate: Number(
          formData.interest_rate
        ),
        interest_type: formData.interest_type,
        tenure_months: Number(
          formData.tenure_months
        ),
        start_date: formData.start_date,
        maturity_date: formData.maturity_date,
        purpose: formData.purpose || null,
      };

      await api.post("/loans", loanData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setShowForm(false);
      resetForm();

      await fetchLoansAndCustomers();
    } catch (error) {
      console.error("Add loan error:", error);

      if (error.response) {
        const detail = error.response.data.detail;

        if (Array.isArray(detail)) {
          setFormError(
            detail
              .map((item) => item.msg)
              .join(", ")
          );
        } else {
          setFormError(
            detail || "Failed to create loan"
          );
        }
      } else {
        setFormError(
          "Cannot connect to the backend"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    const search = searchTerm.toLowerCase();

    const customerName = getCustomerName(
      loan.customer_id
    );

    const matchesSearch =
      String(loan.id)
        .toLowerCase()
        .includes(search) ||
      String(loan.customer_id)
        .toLowerCase()
        .includes(search) ||
      customerName
        .toLowerCase()
        .includes(search) ||
      loan.purpose
        ?.toLowerCase()
        .includes(search) ||
      loan.interest_type
        ?.toLowerCase()
        .includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      loan.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleViewLoan = (loan) => {
    navigate(`/loans/${loan.id}`);
  };

  return (
    <div className="loans-page">

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Loans</h1>

          <p>
            Manage all loans and their repayment information
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            className="primary-button"
            onClick={handleOpenForm}
          >
            <Plus size={18} />
            Add Loan
          </button>
        )}
      </div>

      {/* Add Loan Form */}
      {showForm && (
        <div className="loan-form-card">

          <div className="loan-form-header">

            <div>
              <h2>Add New Loan</h2>

              <p>
                Enter the loan details below
              </p>
            </div>

            <button
              type="button"
              className="form-close-button"
              onClick={handleCancelForm}
            >
              <X size={20} />
            </button>

          </div>

          <form onSubmit={handleAddLoan}>

            <div className="loan-form-grid">

              {/* Customer */}
              <div className="form-group">
                <label>Customer *</label>

                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select customer
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.full_name} -{" "}
                      {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Principal */}
              <div className="form-group">
                <label>
                  Principal Amount *
                </label>

                <input
                  type="number"
                  name="principal_amount"
                  value={
                    formData.principal_amount
                  }
                  onChange={handleInputChange}
                  placeholder="Enter principal amount"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {/* Interest Rate */}
              <div className="form-group">
                <label>
                  Interest Rate (%) *
                </label>

                <input
                  type="number"
                  name="interest_rate"
                  value={
                    formData.interest_rate
                  }
                  onChange={handleInputChange}
                  placeholder="Enter interest rate"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              {/* Interest Type */}
              <div className="form-group">
                <label>
                  Interest Type *
                </label>

                <select
                  name="interest_type"
                  value={
                    formData.interest_type
                  }
                  onChange={handleInputChange}
                  required
                >
                  <option value="reducing">
                    Reducing Balance
                  </option>

                  <option value="flat">
                    Flat Rate
                  </option>
                </select>
              </div>

              {/* Tenure */}
              <div className="form-group">
                <label>
                  Tenure (Months) *
                </label>

                <input
                  type="number"
                  name="tenure_months"
                  value={
                    formData.tenure_months
                  }
                  onChange={handleInputChange}
                  placeholder="Enter tenure"
                  min="1"
                  required
                />
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label>
                  Start Date *
                </label>

                <input
                  type="date"
                  name="start_date"
                  value={
                    formData.start_date
                  }
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Maturity Date */}
              <div className="form-group">
                <label>
                  Maturity Date *
                </label>

                <input
                  type="date"
                  name="maturity_date"
                  value={
                    formData.maturity_date
                  }
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Purpose */}
              <div className="form-group full-width">
                <label>
                  Purpose
                </label>

                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Enter loan purpose"
                  rows="3"
                />
              </div>

            </div>

            {formError && (
              <div className="customer-form-error">
                {formError}
              </div>
            )}

            <div className="customer-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Creating Loan..."
                  : "Create Loan"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* Toolbar */}
      {!showForm && (
        <div className="loan-toolbar">

          <div className="loan-search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by loan ID, customer name or purpose..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="loan-filter">
            <label>Status</label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">
                All Status
              </option>

              <option value="active">
                Active
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </div>

          <div className="loan-count">
            {filteredLoans.length}{" "}
            {filteredLoans.length === 1
              ? "loan"
              : "loans"}
          </div>

        </div>
      )}

      {/* Loading */}
      {!showForm && loading && (
        <div className="loans-loading">
          <Loader2
            size={28}
            className="loading-spinner"
          />

          <p>Loading loans...</p>
        </div>
      )}

      {/* Error */}
      {!showForm && !loading && error && (
        <div className="loans-error">
          <CreditCard size={32} />

          <h3>
            Unable to load loans
          </h3>

          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={fetchLoansAndCustomers}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty */}
      {!showForm &&
        !loading &&
        !error &&
        filteredLoans.length === 0 && (
          <div className="loans-empty">
            <CreditCard size={34} />

            <h3>No loans found</h3>

            <p>
              {searchTerm ||
              statusFilter !== "all"
                ? "Try changing your search or status filter."
                : "There are no loans available yet."}
            </p>
          </div>
        )}

      {/* Loans List */}
      {!showForm &&
        !loading &&
        !error &&
        filteredLoans.length > 0 && (
          <div className="loans-grid">

            {filteredLoans.map((loan) => (
              <div
                className="loan-card"
                key={loan.id}
              >

                {/* Loan Header */}
                <div className="loan-card-header">

                  <div className="loan-card-title">

                    <div className="loan-card-icon">
                      <CreditCard size={20} />
                    </div>

                    <div>
                      <h3>
                        Loan #{loan.id}
                      </h3>

                      <p>
                        {getCustomerName(
                          loan.customer_id
                        )}
                      </p>
                    </div>

                  </div>

                  <span
                    className={getStatusClass(
                      loan.status
                    )}
                  >
                    {loan.status}
                  </span>

                </div>

                {/* Loan Information */}
                <div className="loan-info-grid">

                  <div className="loan-info-item">

                    <div className="loan-info-icon">
                      <IndianRupee size={17} />
                    </div>

                    <div>
                      <span>
                        Principal Amount
                      </span>

                      <strong>
                        {formatCurrency(
                          loan.principal_amount
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="loan-info-item">

                    <div className="loan-info-icon">
                      <Percent size={17} />
                    </div>

                    <div>
                      <span>
                        Interest Rate
                      </span>

                      <strong>
                        {loan.interest_rate}%
                      </strong>
                    </div>

                  </div>

                  <div className="loan-info-item">

                    <div className="loan-info-icon">
                      <Clock size={17} />
                    </div>

                    <div>
                      <span>
                        Tenure
                      </span>

                      <strong>
                        {loan.tenure_months} months
                      </strong>
                    </div>

                  </div>

                  <div className="loan-info-item">

                    <div className="loan-info-icon">
                      <Percent size={17} />
                    </div>

                    <div>
                      <span>
                        Interest Type
                      </span>

                      <strong>
                        {loan.interest_type}
                      </strong>
                    </div>

                  </div>

                  <div className="loan-info-item">

                    <div className="loan-info-icon">
                      <CalendarDays size={17} />
                    </div>

                    <div>
                      <span>
                        Start Date
                      </span>

                      <strong>
                        {formatDate(
                          loan.start_date
                        )}
                      </strong>
                    </div>

                  </div>

                  <div className="loan-info-item">

                    <div className="loan-info-icon">
                      <CalendarDays size={17} />
                    </div>

                    <div>
                      <span>
                        Maturity Date
                      </span>

                      <strong>
                        {formatDate(
                          loan.maturity_date
                        )}
                      </strong>
                    </div>

                  </div>

                </div>

                {/* Purpose */}
                <div className="loan-purpose">

                  <span>
                    Purpose
                  </span>

                  <strong>
                    {loan.purpose ||
                      "General Loan"}
                  </strong>

                </div>

                {/* Actions */}
                <div className="loan-card-actions">

                  <button
                    type="button"
                    className="view-button"
                    onClick={() =>
                      handleViewLoan(loan)
                    }
                  >
                    <Eye size={14} />
                    View Loan
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

    </div>
  );
}

export default Loans;