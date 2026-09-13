import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  CalendarDays,
  Loader2,
  CreditCard,
  IndianRupee,
  Percent,
  Clock,
  Eye,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function CustomerDetails() {
  const { customerId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(true);

  const [error, setError] = useState("");
  const [loansError, setLoansError] = useState("");

  // =========================================================
  // FETCH CUSTOMER + LOANS
  // =========================================================

  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/customers/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCustomer(response.data);
      } catch (error) {
        console.error(
          "Fetch customer details error:",
          error
        );

        if (error.response) {
          setError(
            error.response.data.detail ||
              "Failed to load customer details"
          );
        } else {
          setError("Cannot connect to the backend");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchCustomerLoans = async () => {
      try {
        setLoansLoading(true);
        setLoansError("");

        const response = await api.get(
          `/loans/customer/${customerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setLoans(response.data);
      } catch (error) {
        console.error(
          "Fetch customer loans error:",
          error
        );

        if (error.response) {
          setLoansError(
            error.response.data.detail ||
              "Failed to load customer loans"
          );
        } else {
          setLoansError("Cannot connect to the backend");
        }
      } finally {
        setLoansLoading(false);
      }
    };

    if (token && customerId) {
      fetchCustomerDetails();
      fetchCustomerLoans();
    }
  }, [customerId, token]);

  // =========================================================
  // LOADING CUSTOMER
  // =========================================================

  if (loading) {
    return (
      <div className="customer-details-loading">
        <Loader2 size={28} className="loading-spinner" />

        <p>Loading customer details...</p>
      </div>
    );
  }

  // =========================================================
  // CUSTOMER ERROR
  // =========================================================

  if (error) {
    return (
      <div className="customer-details-error">
        <h2>Unable to load customer</h2>

        <p>{error}</p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft size={16} />
          Back to Customers
        </button>
      </div>
    );
  }

  // =========================================================
  // CUSTOMER NOT FOUND
  // =========================================================

  if (!customer) {
    return (
      <div className="customer-details-error">
        <h2>Customer not found</h2>

        <p>
          The requested customer could not be found.
        </p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/customers")}
        >
          <ArrowLeft size={16} />
          Back to Customers
        </button>
      </div>
    );
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formattedDate = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      )
    : "Not available";

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const formatCurrency = (amount) => {
    const numericAmount = Number(amount || 0);

    return numericAmount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // FORMAT LOAN DATE
  // =========================================================

  const formatLoanDate = (dateValue) => {
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

  // =========================================================
  // LOAN STATUS CLASS
  // =========================================================

  const getLoanStatusClass = (status) => {
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

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="customer-details-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="page-header">

        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/customers")}
          >
            <ArrowLeft size={18} />
            Back to Customers
          </button>

          <h1>Customer Details</h1>

          <p>
            View complete information about this customer
          </p>
        </div>

      </div>

      {/* =====================================================
          CUSTOMER PROFILE CARD
      ===================================================== */}

      <div className="customer-profile-card">

        <div className="customer-profile-header">

          <div className="customer-profile-avatar">
            {customer.full_name
              ?.charAt(0)
              .toUpperCase() || (
              <User size={30} />
            )}
          </div>

          <div>
            <h2>{customer.full_name}</h2>

            <p>
              Customer ID: #{customer.id}
            </p>
          </div>

        </div>

        {/* =================================================
            CUSTOMER INFORMATION
        ================================================= */}

        <div className="customer-details-grid">

          {/* Phone */}

          <div className="customer-detail-item">

            <div className="customer-detail-icon">
              <Phone size={19} />
            </div>

            <div>
              <span>Phone Number</span>

              <strong>
                {customer.phone || "Not available"}
              </strong>
            </div>

          </div>

          {/* Email */}

          <div className="customer-detail-item">

            <div className="customer-detail-icon">
              <Mail size={19} />
            </div>

            <div>
              <span>Email Address</span>

              <strong>
                {customer.email || "Not available"}
              </strong>
            </div>

          </div>

          {/* Occupation */}

          <div className="customer-detail-item">

            <div className="customer-detail-icon">
              <Briefcase size={19} />
            </div>

            <div>
              <span>Occupation</span>

              <strong>
                {customer.occupation || "Not available"}
              </strong>
            </div>

          </div>

          {/* Customer Since */}

          <div className="customer-detail-item">

            <div className="customer-detail-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>Customer Since</span>

              <strong>
                {formattedDate}
              </strong>
            </div>

          </div>

          {/* Address */}

          <div className="customer-detail-item full-width">

            <div className="customer-detail-icon">
              <MapPin size={19} />
            </div>

            <div>
              <span>Address</span>

              <strong>
                {customer.address || "Not available"}
              </strong>
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          LOAN INFORMATION
      ===================================================== */}

      <div className="customer-loans-card">

        <div className="customer-section-header">

          <div>
            <h2>Loan Information</h2>

            <p>
              Loans associated with this customer
            </p>
          </div>

          <div className="loan-count-badge">
            {loans.length}{" "}
            {loans.length === 1 ? "Loan" : "Loans"}
          </div>

        </div>

        {/* =================================================
            LOANS LOADING
        ================================================= */}

        {loansLoading && (
          <div className="customer-details-loading">
            <Loader2
              size={24}
              className="loading-spinner"
            />

            <p>Loading loan information...</p>
          </div>
        )}

        {/* =================================================
            LOANS ERROR
        ================================================= */}

        {!loansLoading && loansError && (
          <div className="customer-loans-error">
            <p>{loansError}</p>
          </div>
        )}

        {/* =================================================
            NO LOANS
        ================================================= */}

        {!loansLoading &&
          !loansError &&
          loans.length === 0 && (
            <div className="customer-loans-empty">

              <CreditCard size={30} />

              <h3>No loans found</h3>

              <p>
                This customer does not have any loans yet.
              </p>

            </div>
          )}

        {/* =================================================
            LOAN LIST
        ================================================= */}

        {!loansLoading &&
          !loansError &&
          loans.length > 0 && (
            <div className="customer-loans-list">

              {loans.map((loan) => (
                <div
                  className="customer-loan-card"
                  key={loan.id}
                >

                  {/* Loan Header */}

                  <div className="customer-loan-header">

                    <div className="customer-loan-title">

                      <div className="loan-icon">
                        <CreditCard size={20} />
                      </div>

                      <div>
                        <h3>
                          Loan #{loan.id}
                        </h3>

                        <p>
                          {loan.purpose ||
                            "General Loan"}
                        </p>
                      </div>

                    </div>

                    <span
                      className={getLoanStatusClass(
                        loan.status
                      )}
                    >
                      {loan.status}
                    </span>

                  </div>

                  {/* Loan Information */}

                  <div className="customer-loan-info-grid">

                    {/* Principal */}

                    <div className="customer-loan-info">

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

                    {/* Interest */}

                    <div className="customer-loan-info">

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

                    {/* Tenure */}

                    <div className="customer-loan-info">

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

                    {/* Interest Type */}

                    <div className="customer-loan-info">

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

                    {/* Start Date */}

                    <div className="customer-loan-info">

                      <div className="loan-info-icon">
                        <CalendarDays size={17} />
                      </div>

                      <div>
                        <span>
                          Start Date
                        </span>

                        <strong>
                          {formatLoanDate(
                            loan.start_date
                          )}
                        </strong>
                      </div>

                    </div>

                    {/* Maturity Date */}

                    <div className="customer-loan-info">

                      <div className="loan-info-icon">
                        <CalendarDays size={17} />
                      </div>

                      <div>
                        <span>
                          Maturity Date
                        </span>

                        <strong>
                          {formatLoanDate(
                            loan.maturity_date
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* View Loan */}

                  <div className="customer-loan-actions">

                    <button
                      type="button"
                      className="view-button"
                      onClick={() =>
                        navigate(`/loans/${loan.id}`)
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

    </div>
  );
}

export default CustomerDetails;
