import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  IndianRupee,
  Percent,
  CalendarDays,
  Clock,
  User,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Receipt,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

function LoanDetails() {
  const { loanId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loan, setLoan] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [summary, setSummary] = useState(null);
  const [installments, setInstallments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [installmentsLoading, setInstallmentsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [installmentsError, setInstallmentsError] =
    useState("");
    const [completingLoan, setCompletingLoan] = useState(false);
const [completionError, setCompletionError] = useState("");

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const loanResponse = await api.get(
        `/loans/${loanId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const loanData = loanResponse.data;

      setLoan(loanData);

      const customerResponse = await api.get(
        `/customers/${loanData.customer_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCustomer(customerResponse.data);
    } catch (error) {
      console.error(
        "Fetch loan details error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Failed to load loan details"
        );
      } else {
        setError("Cannot connect to the backend");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLoanSummary = async () => {
    try {
      setSummaryLoading(true);
      setSummaryError("");

      const response = await api.get(
        `/loans/${loanId}/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSummary(response.data);
    } catch (error) {
      console.error(
        "Fetch loan summary error:",
        error
      );

      if (error.response) {
        setSummaryError(
          error.response.data.detail ||
            "Failed to load financial summary"
        );
      } else {
        setSummaryError(
          "Cannot connect to the backend"
        );
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchInstallments = async () => {
    try {
      setInstallmentsLoading(true);
      setInstallmentsError("");

      const response = await api.get(
        `/installments/loan/${loanId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setInstallments(response.data);
    } catch (error) {
      console.error(
        "Fetch installments error:",
        error
      );

      if (error.response) {
        setInstallmentsError(
          error.response.data.detail ||
            "Failed to load installment schedule"
        );
      } else {
        setInstallmentsError(
          "Cannot connect to the backend"
        );
      }
    } finally {
      setInstallmentsLoading(false);
    }
  };

  useEffect(() => {
    if (token && loanId) {
      fetchLoanDetails();
      fetchLoanSummary();
      fetchInstallments();
    }
  }, [token, loanId]);

  const formatCurrency = (amount) => {
      // =========================================================
  // MARK LOAN AS COMPLETED
  // =========================================================

  const handleCompleteLoan = async () => {
    if (!loan || loan.status?.toLowerCase() !== "active") {
      return;
    }

    const allInstallmentsPaid =
      installments.length > 0 &&
      installments.every(
        (installment) =>
          Number(installment.paid_amount || 0) >=
          Number(installment.total_amount || 0)
      );

    if (!allInstallmentsPaid) {
      setCompletionError(
        "This loan cannot be completed because some installments are still unpaid."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to mark Loan #${loan.id} as completed?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCompletingLoan(true);
      setCompletionError("");

      const response = await api.put(
        `/loans/${loanId}`,
        {
          status: "completed",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setLoan(response.data);

      // Refresh financial summary and installments
      await fetchLoanSummary();
      await fetchInstallments();
    } catch (error) {
      console.error(
        "Complete loan error:",
        error
      );

      if (error.response) {
        setCompletionError(
          error.response.data.detail ||
            "Failed to complete the loan."
        );
      } else {
        setCompletionError(
          "Cannot connect to the backend."
        );
      }
    } finally {
      setCompletingLoan(false);
    }
  };
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
        return "loan-details-status active";

      case "completed":
        return "loan-details-status completed";

      case "pending":
        return "loan-details-status pending";

      case "cancelled":
        return "loan-details-status cancelled";

      default:
        return "loan-details-status";
    }
  };

  const getInstallmentStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "installment-status paid";

      case "partial":
        return "installment-status partial";

      case "overdue":
        return "installment-status overdue";

      case "pending":
        return "installment-status pending";

      default:
        return "installment-status";
    }
  };

  if (loading) {
    return (
      <div className="loan-details-loading">
        <Loader2
          size={30}
          className="loading-spinner"
        />
        <p>Loading loan details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loan-details-error">
        <AlertCircle size={34} />

        <h2>Unable to load loan</h2>

        <p>{error}</p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/loans")}
        >
          <ArrowLeft size={16} />
          Back to Loans
        </button>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="loan-details-error">
        <AlertCircle size={34} />

        <h2>Loan not found</h2>

        <p>
          The requested loan could not be found.
        </p>

        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/loans")}
        >
          <ArrowLeft size={16} />
          Back to Loans
        </button>
      </div>
    );
  }

  const repaymentProgress = Number(
    summary?.repayment_progress || 0
  );

  return (
    <div className="loan-details-page">

      {/* Page Header */}

      <div className="loan-details-page-header">

        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/loans")}
          >
            <ArrowLeft size={18} />
            Back to Loans
          </button>

          <div className="loan-details-heading">

            <div className="loan-details-heading-icon">
              <CreditCard size={24} />
            </div>

            <div>
              <h1>
                Loan #{loan.id}
              </h1>

              <p>
                Complete information about this loan
              </p>
            </div>

          </div>
        </div>

        <span
          className={getStatusClass(loan.status)}
        >
          {loan.status}
        </span>

      </div>

      {/* Customer Information */}
            {completionError && (
        <div className="loan-completion-error">
          <AlertCircle size={18} />
          <p>{completionError}</p>
        </div>
      )}

      <div className="loan-details-card">

        <div className="loan-details-card-header">
          <div>
            <h2>Customer Information</h2>

            <p>
              Customer associated with this loan
            </p>
          </div>
        </div>

        <div className="loan-customer-section">

          <div className="loan-customer-avatar">
            {customer?.full_name
              ?.charAt(0)
              .toUpperCase() || (
              <User size={25} />
            )}
          </div>

          <div className="loan-customer-main">

            <h3>
              {customer?.full_name ||
                `Customer #${loan.customer_id}`}
            </h3>

            <span>
              Customer ID: #{loan.customer_id}
            </span>

          </div>

          <div className="loan-customer-details">

            <div className="loan-customer-detail">
              <User size={16} />

              <div>
                <span>Phone</span>

                <strong>
                  {customer?.phone ||
                    "Not available"}
                </strong>
              </div>
            </div>

            <div className="loan-customer-detail">
              <Briefcase size={16} />

              <div>
                <span>Occupation</span>

                <strong>
                  {customer?.occupation ||
                    "Not available"}
                </strong>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Loan Information */}

      <div className="loan-details-card">

        <div className="loan-details-card-header">

          <div>
            <h2>Loan Information</h2>

            <p>
              Financial and repayment terms
            </p>
          </div>

        </div>

        <div className="loan-details-info-grid">

          <div className="loan-details-info-item">
            <div className="loan-details-info-icon">
              <IndianRupee size={19} />
            </div>

            <div>
              <span>Principal Amount</span>

              <strong>
                {formatCurrency(
                  loan.principal_amount
                )}
              </strong>
            </div>
          </div>

          <div className="loan-details-info-item">
            <div className="loan-details-info-icon">
              <Percent size={19} />
            </div>

            <div>
              <span>Interest Rate</span>

              <strong>
                {loan.interest_rate}%
              </strong>
            </div>
          </div>

          <div className="loan-details-info-item">
            <div className="loan-details-info-icon">
              <Percent size={19} />
            </div>

            <div>
              <span>Interest Type</span>

              <strong>
                {loan.interest_type}
              </strong>
            </div>
          </div>

          <div className="loan-details-info-item">
            <div className="loan-details-info-icon">
              <Clock size={19} />
            </div>

            <div>
              <span>Tenure</span>

              <strong>
                {loan.tenure_months} months
              </strong>
            </div>
          </div>

          <div className="loan-details-info-item">
            <div className="loan-details-info-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>Start Date</span>

              <strong>
                {formatDate(loan.start_date)}
              </strong>
            </div>
          </div>

          <div className="loan-details-info-item">
            <div className="loan-details-info-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>Maturity Date</span>

              <strong>
                {formatDate(
                  loan.maturity_date
                )}
              </strong>
            </div>
          </div>

        </div>

        <div className="loan-details-purpose">

          <span>Loan Purpose</span>

          <strong>
            {loan.purpose || "General Loan"}
          </strong>

        </div>

      </div>

      {/* Financial Summary */}

      <div className="loan-financial-summary-card">

        <div className="loan-details-card-header">

          <div>
            <h2>Financial Summary</h2>

            <p>
              Current repayment and outstanding information
            </p>
          </div>

        </div>

        {summaryLoading && (
          <div className="loan-summary-loading">
            <Loader2
              size={25}
              className="loading-spinner"
            />

            <p>
              Loading financial summary...
            </p>
          </div>
        )}

        {!summaryLoading && summaryError && (
          <div className="loan-summary-error">
            <AlertCircle size={20} />

            <p>{summaryError}</p>
          </div>
        )}

        {!summaryLoading &&
          !summaryError &&
          summary && (
            <>
              <div className="loan-financial-summary-grid">

                <div className="loan-financial-item">

                  <div className="loan-financial-icon payable">
                    <IndianRupee size={20} />
                  </div>

                  <div>
                    <span>Total Payable</span>

                    <strong>
                      {formatCurrency(
                        summary.total_payable
                      )}
                    </strong>
                  </div>

                </div>

                <div className="loan-financial-item">

                  <div className="loan-financial-icon paid">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <span>Total Paid</span>

                    <strong>
                      {formatCurrency(
                        summary.total_paid
                      )}
                    </strong>
                  </div>

                </div>

                <div className="loan-financial-item">

                  <div className="loan-financial-icon outstanding">
                    <IndianRupee size={20} />
                  </div>

                  <div>
                    <span>Outstanding</span>

                    <strong>
                      {formatCurrency(
                        summary.outstanding_amount
                      )}
                    </strong>
                  </div>

                </div>

                <div className="loan-financial-item">

                  <div className="loan-financial-icon overdue">
                    <AlertCircle size={20} />
                  </div>

                  <div>
                    <span>
                      Overdue Installments
                    </span>

                    <strong>
                      {summary.overdue_count}
                    </strong>
                  </div>

                </div>

              </div>

              <div className="loan-repayment-progress">

                <div className="loan-progress-header">

                  <div>
                    <span>
                      Repayment Progress
                    </span>

                    <strong>
                      {repaymentProgress.toFixed(2)}%
                    </strong>
                  </div>

                </div>

                <div className="loan-progress-bar">

                  <div
                    className="loan-progress-fill"
                    style={{
                      width: `${Math.min(
                        repaymentProgress,
                        100
                      )}%`,
                    }}
                  />

                </div>

                <p>
                  {formatCurrency(
                    summary.total_paid
                  )}{" "}
                  collected out of{" "}
                  {formatCurrency(
                    summary.total_payable
                  )}
                </p>

              </div>
            </>
          )}

      </div>

      {/* Installment Schedule */}

      <div className="loan-installments-card">

        <div className="loan-details-card-header">

          <div>
            <h2>Installment Schedule</h2>

            <p>
              Complete repayment schedule for this loan
            </p>
          </div>

          <div className="loan-installment-count">
            {installments.length}{" "}
            {installments.length === 1
              ? "Installment"
              : "Installments"}
          </div>

        </div>

        {installmentsLoading && (
          <div className="loan-installments-loading">

            <Loader2
              size={26}
              className="loading-spinner"
            />

            <p>
              Loading installment schedule...
            </p>

          </div>
        )}

        {!installmentsLoading &&
          installmentsError && (
            <div className="loan-installments-error">

              <AlertCircle size={20} />

              <p>
                {installmentsError}
              </p>

            </div>
          )}

        {!installmentsLoading &&
          !installmentsError &&
          installments.length === 0 && (
            <div className="loan-installments-empty">

              <Receipt size={32} />

              <h3>
                No installments found
              </h3>

              <p>
                An installment schedule has not been
                created for this loan yet.
              </p>

            </div>
          )}

        {!installmentsLoading &&
          !installmentsError &&
          installments.length > 0 && (
            <div className="loan-installments-table-wrapper">

              <table className="loan-installments-table">

                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Remaining</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {installments.map(
                    (installment) => {

                      const remainingAmount =
                        Math.max(
                          Number(
                            installment.total_amount ||
                              0
                          ) -
                            Number(
                              installment.paid_amount ||
                                0
                            ),
                          0
                        );

                      return (
                        <tr
                          key={installment.id}
                        >

                          <td>
                            <strong>
                              {
                                installment.installment_number
                              }
                            </strong>
                          </td>

                          <td>
                            {formatDate(
                              installment.due_date
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              installment.principal_amount
                            )}
                          </td>

                          <td>
                            {formatCurrency(
                              installment.interest_amount
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                installment.total_amount
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              installment.paid_amount
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatCurrency(
                                remainingAmount
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={getInstallmentStatusClass(
                                installment.status
                              )}
                            >
                              {installment.status}
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

      {/* Current Status */}

      <div className="loan-details-status-card">

        <div className="loan-details-status-icon">
          <CheckCircle2 size={24} />
        </div>

        <div>
          <span>Current Loan Status</span>

          <strong>
            {loan.status}
          </strong>

          <p>
            This loan is currently registered in
            the system.
          </p>
        </div>

      </div>

    </div>
  );
}

export default LoanDetails;