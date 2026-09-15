import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  Download,
  IndianRupee,
  RefreshCw,
  TrendingDown,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Reports() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const [portfolioReport, setPortfolioReport] = useState(null);
  const [paymentReport, setPaymentReport] = useState(null);
  const [outstandingReport, setOutstandingReport] = useState(null);
  const [customerFinancialReport, setCustomerFinancialReport] =
    useState(null);
  const [dateRangeReport, setDateRangeReport] = useState(null);

  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
  const [loadingCustomerFinancial, setLoadingCustomerFinancial] =
    useState(false);
  const [loadingDateRange, setLoadingDateRange] = useState(false);

  const [portfolioVisible, setPortfolioVisible] = useState(false);
  const [paymentsVisible, setPaymentsVisible] = useState(false);
  const [outstandingVisible, setOutstandingVisible] = useState(false);
  const [customerFinancialVisible, setCustomerFinancialVisible] =
    useState(false);
  const [dateRangeVisible, setDateRangeVisible] = useState(false);

  const [customerFinancialError, setCustomerFinancialError] =
    useState("");

  const [dateRangeError, setDateRangeError] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [exportingReport, setExportingReport] = useState("");
  const [exportError, setExportError] = useState("");

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPercentage = (value) => {
    return `${Number(value || 0).toFixed(2)}%`;
  };

  const getStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "active":
        return "loan-status-badge loan-status-active";

      case "completed":
        return "loan-status-badge loan-status-completed";

      case "cancelled":
        return "loan-status-badge loan-status-cancelled";

      default:
        return "loan-status-badge";
    }
  };

  const getPaymentMethodClass = (method) => {
    switch (String(method || "").toLowerCase()) {
      case "cash":
        return "payment-method-badge payment-method-cash";

      case "upi":
        return "payment-method-badge payment-method-upi";

      case "bank":
      case "bank transfer":
      case "bank_transfer":
      case "neft":
      case "rtgs":
      case "imps":
        return "payment-method-badge payment-method-bank";

      default:
        return "payment-method-badge payment-method-other";
    }
  };

  const getOutstandingStatusClass = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "overdue":
        return "outstanding-status-badge outstanding-status-overdue";

      case "due_soon":
        return "outstanding-status-badge outstanding-status-due-soon";

      case "upcoming":
        return "outstanding-status-badge outstanding-status-upcoming";

      default:
        return "outstanding-status-badge";
    }
  };

  const getOutstandingStatusLabel = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "overdue":
        return "Overdue";

      case "due_soon":
        return "Due Soon";

      case "upcoming":
        return "Upcoming";

      default:
        return status || "-";
    }
  };

  // =========================================================
  // LOAN PORTFOLIO
  // =========================================================

  const fetchLoanPortfolio = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingPortfolio(true);

      const response = await fetch(
        `${API_URL}/reports/loan-portfolio`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch loan portfolio report.");
      }

      const data = await response.json();

      setPortfolioReport(data);
    } catch (error) {
      console.error("Loan portfolio report error:", error);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  // =========================================================
  // PAYMENT COLLECTION
  // =========================================================

  const fetchPaymentCollection = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingPayments(true);

      const response = await fetch(
        `${API_URL}/reports/payment-collection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch payment collection report."
        );
      }

      const data = await response.json();

      setPaymentReport(data);
    } catch (error) {
      console.error("Payment collection report error:", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  // =========================================================
  // OUTSTANDING & OVERDUE
  // =========================================================

  const fetchOutstandingReport = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingOutstanding(true);

      const response = await fetch(
        `${API_URL}/reports/outstanding-overdue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch outstanding and overdue report."
        );
      }

      const data = await response.json();

      setOutstandingReport(data);
    } catch (error) {
      console.error(
        "Outstanding and overdue report error:",
        error
      );
    } finally {
      setLoadingOutstanding(false);
    }
  };

  // =========================================================
  // CUSTOMER FINANCIAL REPORT
  // =========================================================

  const fetchCustomerFinancialReport = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingCustomerFinancial(true);
      setCustomerFinancialError("");

      const response = await fetch(
        `${API_URL}/reports/customer-financial`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message =
          "Failed to fetch customer financial report.";

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            message =
              typeof errorData.detail === "string"
                ? errorData.detail
                : message;
          }
        } catch {
          // Keep default message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      setCustomerFinancialReport(data);
    } catch (error) {
      console.error(
        "Customer financial report error:",
        error
      );

      setCustomerFinancialError(
        error.message ||
          "Unable to load customer financial report."
      );
    } finally {
      setLoadingCustomerFinancial(false);
    }
  };

  // =========================================================
  // DATE RANGE REPORT
  // =========================================================

  const fetchDateRangeReport = async () => {
    if (!token) {
      return;
    }

    if (!fromDate || !toDate) {
      setDateRangeError(
        "Please select both From Date and To Date."
      );
      return;
    }

    if (fromDate > toDate) {
      setDateRangeError(
        "From Date cannot be later than To Date."
      );
      return;
    }

    try {
      setLoadingDateRange(true);
      setDateRangeError("");

      const response = await fetch(
        `${API_URL}/reports/date-range?from_date=${encodeURIComponent(
          fromDate
        )}&to_date=${encodeURIComponent(toDate)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.error ||
            "Failed to fetch date range report."
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setDateRangeReport(data);
      setDateRangeVisible(true);

      setTimeout(() => {
        document
          .getElementById("date-range-report")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 100);
    } catch (error) {
      console.error(
        "Date range report error:",
        error
      );

      setDateRangeError(
        error.message ||
          "Unable to load date range report."
      );

      setDateRangeReport(null);
    } finally {
      setLoadingDateRange(false);
    }
  };

  // =========================================================
  // EXPORT REPORTS
  // =========================================================

  const downloadCsvReport = async (endpoint, filename) => {
    if (!token) {
      return;
    }

    try {
      setExportingReport(filename);
      setExportError("");

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        let message = "Failed to export report.";

        try {
          const errorData = await response.json();

          if (errorData?.detail) {
            message =
              typeof errorData.detail === "string"
                ? errorData.detail
                : message;
          }
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Report export error:", error);

      setExportError(
        error.message || "Unable to export report."
      );
    } finally {
      setExportingReport("");
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchLoanPortfolio();
    fetchPaymentCollection();
    fetchOutstandingReport();
  }, [token]);

  // =========================================================
  // REPORT BUTTONS
  // =========================================================

  const handleViewPortfolio = async () => {
    setPortfolioVisible(true);

    if (!portfolioReport) {
      await fetchLoanPortfolio();
    }

    setTimeout(() => {
      document
        .getElementById("loan-portfolio-report")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleViewPayments = async () => {
    setPaymentsVisible(true);

    if (!paymentReport) {
      await fetchPaymentCollection();
    }

    setTimeout(() => {
      document
        .getElementById("payment-collection-report")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleViewOutstanding = async () => {
    setOutstandingVisible(true);

    if (!outstandingReport) {
      await fetchOutstandingReport();
    }

    setTimeout(() => {
      document
        .getElementById("outstanding-overdue-report")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleViewCustomerFinancial = async () => {
    setCustomerFinancialVisible(true);

    if (!customerFinancialReport) {
      await fetchCustomerFinancialReport();
    }

    setTimeout(() => {
      document
        .getElementById("customer-financial-report")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  const handleViewDateRange = () => {
    setDateRangeVisible(true);

    setTimeout(() => {
      document
        .getElementById("date-range-report")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  return (
    <div className="reports-page">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="reports-header">
        <div className="reports-title-row">
          <div className="reports-title-icon">
            <IndianRupee size={28} />
          </div>

          <div>
            <h1>Reports</h1>

            <p>
              Analyze loans, payments, outstanding balances,
              and business performance.
            </p>
          </div>
        </div>

        <button
          className="reports-dashboard-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>
      </div>

      {/* =====================================================
          OVERVIEW
          ===================================================== */}

      <div className="reports-overview-card">
        <div className="reports-overview-icon">
          <WalletCards size={24} />
        </div>

        <div>
          <h2>Financial Reports</h2>

          <p>
            Use the reports below to monitor your loan
            portfolio, collections, and outstanding amounts.
          </p>
        </div>
      </div>

      {/* =====================================================
          REPORT CARDS
          ===================================================== */}

      <section className="reports-section">
        <div className="reports-section-heading">
          <div>
            <h2>Available Reports</h2>

            <p>
              Select a report to view detailed financial
              information.
            </p>
          </div>
        </div>

        <div className="reports-grid">
          {/* Loan Portfolio */}

          <div className="report-card">
            <div className="report-card-icon report-card-icon-blue">
              <CreditCard size={23} />
            </div>

            <h3>Loan Portfolio</h3>

            <p>
              View active, completed, and cancelled loans
              with principal, interest, collections, and
              outstanding balances.
            </p>

            <button
              className="report-card-button report-card-button-active"
              onClick={handleViewPortfolio}
            >
              View Report
            </button>
          </div>

          {/* Payment Collection */}

          <div className="report-card">
            <div className="report-card-icon report-card-icon-green">
              <Banknote size={23} />
            </div>

            <h3>Payment Collection</h3>

            <p>
              Analyze total collections, payment methods,
              transaction counts, and individual payment
              records.
            </p>

            <button
              className="report-card-button report-card-button-active"
              onClick={handleViewPayments}
            >
              View Report
            </button>
          </div>

          {/* Outstanding & Overdue */}

          <div className="report-card">
            <div className="report-card-icon report-card-icon-orange">
              <CircleAlert size={23} />
            </div>

            <h3>Outstanding & Overdue</h3>

            <p>
              Monitor outstanding balances, overdue amounts,
              upcoming installments, and customer-wise
              outstanding payments.
            </p>

            <button
              className="report-card-button report-card-button-active"
              onClick={handleViewOutstanding}
            >
              View Report
            </button>
          </div>

          {/* Customer Financial Report */}

          <div className="report-card">
            <div className="report-card-icon report-card-icon-purple">
              <Users size={23} />
            </div>

            <h3>Customer Financial Report</h3>

            <p>
              Review customer-wise loan history, payments,
              outstanding balances, and financial activity.
            </p>

            <button
              className="report-card-button report-card-button-active"
              onClick={handleViewCustomerFinancial}
            >
              View Report
            </button>
          </div>

          {/* Date Range Reports */}

          <div className="report-card">
            <div className="report-card-icon report-card-icon-cyan">
              <CalendarClock size={23} />
            </div>

            <h3>Date Range Reports</h3>

            <p>
              Filter collections and newly started loans
              using a custom From Date and To Date.
            </p>

            <button
              className="report-card-button report-card-button-active"
              onClick={handleViewDateRange}
            >
              View Report
            </button>
          </div>

          {/* Export Reports */}

          <div className="report-card export-report-card">
            <div className="report-card-icon report-card-icon-indigo">
              <Download size={23} />
            </div>

            <h3>Export Reports</h3>

            <p>
              Download business reports as CSV files
              for Excel, offline use, and record keeping.
            </p>

            <div className="export-report-actions">
              <button
                type="button"
                className="export-report-button"
                onClick={() =>
                  downloadCsvReport(
                    "/reports/export/loan-portfolio",
                    "loan_portfolio.csv"
                  )
                }
                disabled={Boolean(exportingReport)}
              >
                <Download size={16} />
                {exportingReport === "loan_portfolio.csv"
                  ? "Exporting..."
                  : "Loan Portfolio"}
              </button>

              <button
                type="button"
                className="export-report-button"
                onClick={() =>
                  downloadCsvReport(
                    "/reports/export/payment-collection",
                    "payment_collection.csv"
                  )
                }
                disabled={Boolean(exportingReport)}
              >
                <Download size={16} />
                {exportingReport === "payment_collection.csv"
                  ? "Exporting..."
                  : "Payment Collection"}
              </button>

              <button
                type="button"
                className="export-report-button"
                onClick={() =>
                  downloadCsvReport(
                    "/reports/export/outstanding-overdue",
                    "outstanding_overdue.csv"
                  )
                }
                disabled={Boolean(exportingReport)}
              >
                <Download size={16} />
                {exportingReport === "outstanding_overdue.csv"
                  ? "Exporting..."
                  : "Outstanding & Overdue"}
              </button>

              <button
                type="button"
                className="export-report-button"
                onClick={() =>
                  downloadCsvReport(
                    "/reports/export/customer-financial",
                    "customer_financial.csv"
                  )
                }
                disabled={Boolean(exportingReport)}
              >
                <Download size={16} />
                {exportingReport === "customer_financial.csv"
                  ? "Exporting..."
                  : "Customer Financial"}
              </button>
            </div>

            {exportError && (
              <div className="export-report-error">
                {exportError}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          LOAN PORTFOLIO REPORT
          ===================================================== */}

      {portfolioVisible && (
        <section
          id="loan-portfolio-report"
          className="reports-section detailed-report-section"
        >
          <div className="detailed-report-header">
            <div>
              <h2>Loan Portfolio Report</h2>

              <p>
                Complete overview of the current loan
                portfolio.
              </p>
            </div>

            <button
              className="report-refresh-button"
              onClick={fetchLoanPortfolio}
              disabled={loadingPortfolio}
            >
              <RefreshCw
                size={16}
                className={
                  loadingPortfolio
                    ? "refresh-icon-spinning"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {portfolioReport?.summary && (
            <div className="report-summary-grid">
              <div className="report-summary-card">
                <span>Total Loans</span>

                <strong>
                  {portfolioReport.summary.total_loans}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>Principal Issued</span>

                <strong>
                  {formatCurrency(
                    portfolioReport.summary.total_principal
                  )}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>Total Payable</span>

                <strong>
                  {formatCurrency(
                    portfolioReport.summary.total_payable
                  )}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>Total Collected</span>

                <strong>
                  {formatCurrency(
                    portfolioReport.summary.total_collected
                  )}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>Outstanding</span>

                <strong>
                  {formatCurrency(
                    portfolioReport.summary.total_outstanding
                  )}
                </strong>
              </div>

              <div className="report-summary-card">
                <span>Repayment</span>

                <strong>
                  {formatPercentage(
                    portfolioReport.summary
                      .repayment_percentage
                  )}
                </strong>
              </div>
            </div>
          )}

          {loadingPortfolio ? (
            <div className="report-loading">
              Loading loan portfolio...
            </div>
          ) : (
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Loan</th>
                    <th>Customer</th>
                    <th>Principal</th>
                    <th>Payable</th>
                    <th>Collected</th>
                    <th>Outstanding</th>
                    <th>Installments</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {portfolioReport?.loans?.length > 0 ? (
                    portfolioReport.loans.map((loan) => (
                      <tr key={loan.loan_id}>
                        <td>
                          <strong>
                            Loan #{loan.loan_id}
                          </strong>
                        </td>

                        <td>{loan.customer_name}</td>

                        <td>
                          {formatCurrency(
                            loan.principal_amount
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            loan.total_payable
                          )}
                        </td>

                        <td>
                          {formatCurrency(
                            loan.total_collected
                          )}
                        </td>

                        <td className="amount-danger">
                          {formatCurrency(
                            loan.outstanding
                          )}
                        </td>

                        <td>
                          {loan.paid_installments}/
                          {loan.total_installments}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              loan.status
                            )}
                          >
                            {loan.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="empty-report-cell"
                      >
                        No loan records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          PAYMENT COLLECTION REPORT
          ===================================================== */}

      {paymentsVisible && (
        <section
          id="payment-collection-report"
          className="reports-section payment-collection-report"
        >
          <div className="payment-collection-header">
            <div className="payment-collection-title-row">
              <div className="payment-collection-title-icon">
                <Banknote size={22} />
              </div>

              <div>
                <h2>Payment Collection Report</h2>

                <p>
                  Detailed view of all recorded payment
                  collections.
                </p>
              </div>
            </div>

            <button
              className="payment-collection-refresh-button"
              onClick={fetchPaymentCollection}
              disabled={loadingPayments}
            >
              <RefreshCw
                size={16}
                className={
                  loadingPayments
                    ? "refresh-icon-spinning"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {paymentReport?.summary && (
            <>
              <div className="payment-summary-grid">
                <div className="payment-summary-card">
                  <div className="payment-summary-icon payment-summary-icon-blue">
                    <ReceiptIcon />
                  </div>

                  <div>
                    <span>Total Payments</span>

                    <strong>
                      {
                        paymentReport.summary
                          .total_payments
                      }
                    </strong>
                  </div>
                </div>

                <div className="payment-summary-card">
                  <div className="payment-summary-icon payment-summary-icon-green">
                    <IndianRupee size={19} />
                  </div>

                  <div>
                    <span>Total Collected</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .total_collected
                      )}
                    </strong>
                  </div>
                </div>

                <div className="payment-summary-card">
                  <div className="payment-summary-icon payment-summary-icon-purple">
                    <WalletCards size={19} />
                  </div>

                  <div>
                    <span>Average Payment</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .average_payment
                      )}
                    </strong>
                  </div>
                </div>

                <div className="payment-summary-card">
                  <div className="payment-summary-icon payment-summary-icon-orange">
                    <Banknote size={19} />
                  </div>

                  <div>
                    <span>Cash Collection</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .cash_collected
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="payment-breakdown-section">
                <h3>Payment Method Breakdown</h3>

                <div className="payment-breakdown-grid">
                  <div className="payment-breakdown-card">
                    <span>Cash</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .cash_collected
                      )}
                    </strong>

                    <small>
                      {
                        paymentReport.summary
                          .cash_count
                      }{" "}
                      payments
                    </small>
                  </div>

                  <div className="payment-breakdown-card">
                    <span>UPI</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .upi_collected
                      )}
                    </strong>

                    <small>
                      {
                        paymentReport.summary
                          .upi_count
                      }{" "}
                      payments
                    </small>
                  </div>

                  <div className="payment-breakdown-card">
                    <span>Bank</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .bank_collected
                      )}
                    </strong>

                    <small>
                      {
                        paymentReport.summary
                          .bank_count
                      }{" "}
                      payments
                    </small>
                  </div>

                  <div className="payment-breakdown-card">
                    <span>Other</span>

                    <strong>
                      {formatCurrency(
                        paymentReport.summary
                          .other_collected
                      )}
                    </strong>

                    <small>
                      {
                        paymentReport.summary
                          .other_count
                      }{" "}
                      payments
                    </small>
                  </div>
                </div>
              </div>
            </>
          )}

          {loadingPayments ? (
            <div className="report-loading">
              Loading payment collection...
            </div>
          ) : (
            <div className="payment-table-wrapper">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Payment</th>
                    <th>Customer</th>
                    <th>Loan</th>
                    <th>Installment</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                  </tr>
                </thead>

                <tbody>
                  {paymentReport?.payments?.length > 0 ? (
                    paymentReport.payments.map(
                      (payment) => (
                        <tr key={payment.payment_id}>
                          <td>
                            <strong>
                              #{payment.payment_id}
                            </strong>
                          </td>

                          <td>
                            {payment.customer_name}
                          </td>

                          <td>
                            Loan #{payment.loan_id}
                          </td>

                          <td>
                            {payment.installment_id
                              ? `#${payment.installment_id}`
                              : "-"}
                          </td>

                          <td className="payment-amount">
                            {formatCurrency(
                              payment.amount
                            )}
                          </td>

                          <td>
                            {formatDate(
                              payment.payment_date
                            )}
                          </td>

                          <td>
                            <span
                              className={getPaymentMethodClass(
                                payment.payment_method
                              )}
                            >
                              {
                                payment.payment_method
                              }
                            </span>
                          </td>

                          <td>
                            {payment.reference_number ||
                              "-"}
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="empty-report-cell"
                      >
                        No payment records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* =====================================================
          OUTSTANDING & OVERDUE REPORT
          ===================================================== */}

      {outstandingVisible && (
        <section
          id="outstanding-overdue-report"
          className="reports-section outstanding-overdue-report"
        >
          <div className="outstanding-report-header">
            <div className="outstanding-report-title-row">
              <div className="outstanding-report-title-icon">
                <CircleAlert size={22} />
              </div>

              <div>
                <h2>
                  Outstanding & Overdue Report
                </h2>

                <p>
                  Monitor unpaid installments,
                  outstanding balances, and upcoming
                  payment obligations.
                </p>
              </div>
            </div>

            <button
              className="outstanding-refresh-button"
              onClick={fetchOutstandingReport}
              disabled={loadingOutstanding}
            >
              <RefreshCw
                size={16}
                className={
                  loadingOutstanding
                    ? "refresh-icon-spinning"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {outstandingReport?.summary && (
            <div className="outstanding-summary-grid">
              <div className="outstanding-summary-card outstanding-card-total">
                <div className="outstanding-summary-icon">
                  <WalletCards size={20} />
                </div>

                <div>
                  <span>Total Outstanding</span>

                  <strong>
                    {formatCurrency(
                      outstandingReport.summary
                        .total_outstanding
                    )}
                  </strong>
                </div>
              </div>

              <div className="outstanding-summary-card outstanding-card-overdue">
                <div className="outstanding-summary-icon">
                  <CircleAlert size={20} />
                </div>

                <div>
                  <span>Total Overdue</span>

                  <strong>
                    {formatCurrency(
                      outstandingReport.summary
                        .total_overdue
                    )}
                  </strong>
                </div>
              </div>

              <div className="outstanding-summary-card outstanding-card-due">
                <div className="outstanding-summary-icon">
                  <Clock3 size={20} />
                </div>

                <div>
                  <span>Due Within 7 Days</span>

                  <strong>
                    {formatCurrency(
                      outstandingReport.summary
                        .total_due_soon
                    )}
                  </strong>
                </div>
              </div>

              <div className="outstanding-summary-card outstanding-card-installments">
                <div className="outstanding-summary-icon">
                  <CalendarClock size={20} />
                </div>

                <div>
                  <span>Open Installments</span>

                  <strong>
                    {
                      outstandingReport.summary
                        .total_open_installments
                    }
                  </strong>
                </div>
              </div>
            </div>
          )}

          {outstandingReport?.summary && (
            <div className="outstanding-status-overview">
              <div className="outstanding-status-item">
                <div className="outstanding-status-item-icon overdue-icon">
                  <CircleAlert size={17} />
                </div>

                <div>
                  <span>Overdue Installments</span>

                  <strong>
                    {
                      outstandingReport.summary
                        .overdue_count
                    }
                  </strong>
                </div>
              </div>

              <div className="outstanding-status-item">
                <div className="outstanding-status-item-icon due-soon-icon">
                  <Clock3 size={17} />
                </div>

                <div>
                  <span>Due Soon</span>

                  <strong>
                    {
                      outstandingReport.summary
                        .due_soon_count
                    }
                  </strong>
                </div>
              </div>

              <div className="outstanding-status-item">
                <div className="outstanding-status-item-icon upcoming-icon">
                  <CalendarClock size={17} />
                </div>

                <div>
                  <span>Upcoming / Open</span>

                  <strong>
                    {
                      outstandingReport.summary
                        .total_open_installments -
                      outstandingReport.summary
                        .overdue_count -
                      outstandingReport.summary
                        .due_soon_count
                    }
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="outstanding-customer-section">
            <div className="outstanding-subsection-header">
              <div>
                <h3>Customer-wise Outstanding</h3>

                <p>
                  Customers with unpaid installment
                  balances.
                </p>
              </div>
            </div>

            <div className="outstanding-customer-grid">
              {outstandingReport?.customers?.length >
              0 ? (
                outstandingReport.customers.map(
                  (customer) => (
                    <div
                      className="outstanding-customer-card"
                      key={customer.customer_id}
                    >
                      <div className="outstanding-customer-top">
                        <div className="outstanding-customer-avatar">
                          {String(
                            customer.customer_name ||
                              "?"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h4>
                            {customer.customer_name}
                          </h4>

                          <span>
                            Customer #
                            {customer.customer_id}
                          </span>
                        </div>
                      </div>

                      <div className="outstanding-customer-amount">
                        <span>Outstanding</span>

                        <strong>
                          {formatCurrency(
                            customer.outstanding
                          )}
                        </strong>
                      </div>

                      <div className="outstanding-customer-details">
                        <div>
                          <span>Overdue</span>

                          <strong className="customer-overdue-amount">
                            {formatCurrency(
                              customer.overdue_amount
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Due Soon</span>

                          <strong>
                            {formatCurrency(
                              customer.due_soon_amount
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>Open Installments</span>

                          <strong>
                            {customer.installments}
                          </strong>
                        </div>

                        <div>
                          <span>Overdue Count</span>

                          <strong>
                            {
                              customer.overdue_installments
                            }
                          </strong>
                        </div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="outstanding-empty-state">
                  <CheckCircle2 size={24} />

                  <strong>
                    No customer outstanding records.
                  </strong>

                  <span>
                    All currently tracked installments
                    are paid or there are no open
                    installments.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="outstanding-installment-section">
            <div className="outstanding-subsection-header">
              <div>
                <h3>Outstanding Installments</h3>

                <p>
                  Detailed view of unpaid installments
                  and their current status.
                </p>
              </div>
            </div>

            {loadingOutstanding ? (
              <div className="report-loading">
                Loading outstanding report...
              </div>
            ) : (
              <div className="outstanding-table-wrapper">
                <table className="outstanding-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Loan</th>
                      <th>Installment</th>
                      <th>Due Date</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th>Timing</th>
                    </tr>
                  </thead>

                  <tbody>
                    {outstandingReport?.installments
                      ?.length > 0 ? (
                      outstandingReport.installments.map(
                        (installment) => (
                          <tr
                            key={
                              installment.installment_id
                            }
                          >
                            <td>
                              <strong>
                                {
                                  installment.customer_name
                                }
                              </strong>
                            </td>

                            <td>
                              Loan #
                              {installment.loan_id}
                            </td>

                            <td>
                              #
                              {
                                installment.installment_number
                              }
                            </td>

                            <td>
                              {formatDate(
                                installment.due_date
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                installment.total_amount
                              )}
                            </td>

                            <td>
                              {formatCurrency(
                                installment.paid_amount
                              )}
                            </td>

                            <td className="outstanding-amount">
                              {formatCurrency(
                                installment.outstanding
                              )}
                            </td>

                            <td>
                              <span
                                className={getOutstandingStatusClass(
                                  installment.status
                                )}
                              >
                                {getOutstandingStatusLabel(
                                  installment.status
                                )}
                              </span>
                            </td>

                            <td>
                              {installment.status ===
                              "overdue" ? (
                                <span className="timing-danger">
                                  {
                                    installment.days_overdue
                                  }{" "}
                                  day
                                  {installment.days_overdue !==
                                  1
                                    ? "s"
                                    : ""}{" "}
                                  overdue
                                </span>
                              ) : installment.status ===
                                "due_soon" ? (
                                <span className="timing-warning">
                                  {installment.days_until_due ===
                                  0
                                    ? "Due today"
                                    : `${installment.days_until_due} day${
                                        installment.days_until_due !==
                                        1
                                          ? "s"
                                          : ""
                                      } left`}
                                </span>
                              ) : (
                                <span className="timing-normal">
                                  {
                                    installment.days_until_due
                                  }{" "}
                                  days left
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="empty-report-cell"
                        >
                          <div className="outstanding-table-empty">
                            <CheckCircle2 size={22} />

                            <span>
                              No outstanding installment
                              records found.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          CUSTOMER FINANCIAL REPORT
          ===================================================== */}

      {customerFinancialVisible && (
        <section
          id="customer-financial-report"
          className="reports-section customer-financial-report"
        >
          <div className="customer-financial-header">
            <div className="customer-financial-title-row">
              <div className="customer-financial-title-icon">
                <Users size={22} />
              </div>

              <div>
                <h2>Customer Financial Report</h2>

                <p>
                  Customer-wise financial position, loan
                  history, and repayment performance.
                </p>
              </div>
            </div>

            <button
              className="customer-financial-refresh-button"
              onClick={fetchCustomerFinancialReport}
              disabled={loadingCustomerFinancial}
            >
              <RefreshCw
                size={16}
                className={
                  loadingCustomerFinancial
                    ? "refresh-icon-spinning"
                    : ""
                }
              />

              {loadingCustomerFinancial
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          {loadingCustomerFinancial &&
            !customerFinancialReport && (
              <div className="report-loading">
                Loading customer financial report...
              </div>
            )}

          {customerFinancialError && (
            <div className="report-error-box">
              <AlertTriangle size={20} />

              <div>
                <strong>
                  Unable to load report
                </strong>

                <p>{customerFinancialError}</p>

                <button
                  type="button"
                  onClick={fetchCustomerFinancialReport}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {customerFinancialReport &&
            !customerFinancialError && (
              <>
                <div className="customer-financial-summary-grid">
                  <div className="customer-financial-summary-card">
                    <div className="customer-financial-summary-icon">
                      <Users size={20} />
                    </div>

                    <div>
                      <span>Total Customers</span>

                      <strong>
                        {
                          customerFinancialReport
                            .summary?.total_customers || 0
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="customer-financial-summary-card">
                    <div className="customer-financial-summary-icon">
                      <Wallet size={20} />
                    </div>

                    <div>
                      <span>Customers With Loans</span>

                      <strong>
                        {
                          customerFinancialReport
                            .summary?.customers_with_loans ||
                          0
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="customer-financial-summary-card">
                    <div className="customer-financial-summary-icon">
                      <IndianRupee size={20} />
                    </div>

                    <div>
                      <span>Total Principal</span>

                      <strong>
                        {formatCurrency(
                          customerFinancialReport
                            .summary?.total_principal
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="customer-financial-summary-card">
                    <div className="customer-financial-summary-icon">
                      <CreditCard size={20} />
                    </div>

                    <div>
                      <span>Total Payable</span>

                      <strong>
                        {formatCurrency(
                          customerFinancialReport
                            .summary?.total_payable
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="customer-financial-summary-card">
                    <div className="customer-financial-summary-icon">
                      <CheckCircle2 size={20} />
                    </div>

                    <div>
                      <span>Total Collected</span>

                      <strong>
                        {formatCurrency(
                          customerFinancialReport
                            .summary?.total_collected
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="customer-financial-summary-card customer-financial-outstanding-card">
                    <div className="customer-financial-summary-icon">
                      <TrendingDown size={20} />
                    </div>

                    <div>
                      <span>Total Outstanding</span>

                      <strong>
                        {formatCurrency(
                          customerFinancialReport
                            .summary?.total_outstanding
                        )}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="customer-financial-progress-card">
                  <div className="customer-financial-progress-header">
                    <div>
                      <span>
                        Overall Repayment Progress
                      </span>

                      <strong>
                        {formatPercentage(
                          customerFinancialReport
                            .summary
                            ?.repayment_percentage
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="customer-financial-progress-track">
                    <div
                      className="customer-financial-progress-fill"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            Number(
                              customerFinancialReport
                                .summary
                                ?.repayment_percentage || 0
                            ),
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="customer-financial-customers-section">
                  <div className="customer-financial-section-heading">
                    <div>
                      <h3>
                        Customer Financial Details
                      </h3>

                      <p>
                        Complete financial position and
                        loan history for each customer.
                      </p>
                    </div>

                    <span className="customer-financial-count">
                      {
                        customerFinancialReport
                          .customers?.length || 0
                      }{" "}
                      Customers
                    </span>
                  </div>

                  {customerFinancialReport.customers
                    ?.length === 0 ? (
                    <div className="customer-financial-empty">
                      <Users size={30} />

                      <strong>
                        No customer data found
                      </strong>

                      <p>
                        There are currently no customers
                        with financial information.
                      </p>
                    </div>
                  ) : (
                    <div className="customer-financial-customer-list">
                      {customerFinancialReport.customers.map(
                        (customer) => (
                          <div
                            className="customer-financial-card"
                            key={customer.customer_id}
                          >
                            <div className="customer-financial-card-header">
                              <div className="customer-financial-customer-info">
                                <div className="customer-financial-avatar">
                                  {customer.customer_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "C"}
                                </div>

                                <div>
                                  <h4>
                                    {
                                      customer.customer_name
                                    }
                                  </h4>

                                  <span>
                                    Customer #
                                    {
                                      customer.customer_id
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="customer-financial-repayment-badge">
                                {formatPercentage(
                                  customer.repayment_percentage
                                )}{" "}
                                repaid
                              </div>
                            </div>

                            <div className="customer-financial-stats-grid">
                              <div>
                                <span>Total Loans</span>

                                <strong>
                                  {customer.total_loans ||
                                    0}
                                </strong>
                              </div>

                              <div>
                                <span>Active</span>

                                <strong>
                                  {customer.active_loans ||
                                    0}
                                </strong>
                              </div>

                              <div>
                                <span>Completed</span>

                                <strong>
                                  {customer.completed_loans ||
                                    0}
                                </strong>
                              </div>

                              <div>
                                <span>Cancelled</span>

                                <strong>
                                  {customer.cancelled_loans ||
                                    0}
                                </strong>
                              </div>

                              <div>
                                <span>Principal</span>

                                <strong>
                                  {formatCurrency(
                                    customer.total_principal
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>Payable</span>

                                <strong>
                                  {formatCurrency(
                                    customer.total_payable
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>Paid</span>

                                <strong>
                                  {formatCurrency(
                                    customer.total_paid
                                  )}
                                </strong>
                              </div>

                              <div className="customer-financial-stat-outstanding">
                                <span>
                                  Outstanding
                                </span>

                                <strong>
                                  {formatCurrency(
                                    customer.outstanding
                                  )}
                                </strong>
                              </div>
                            </div>

                            <div className="customer-financial-card-progress">
                              <div>
                                <span>
                                  Repayment Progress
                                </span>

                                <strong>
                                  {formatPercentage(
                                    customer.repayment_percentage
                                  )}
                                </strong>
                              </div>

                              <div className="customer-financial-progress-track">
                                <div
                                  className="customer-financial-progress-fill"
                                  style={{
                                    width: `${Math.min(
                                      Math.max(
                                        Number(
                                          customer.repayment_percentage ||
                                            0
                                        ),
                                        0
                                      ),
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="customer-financial-loans">
                              <div className="customer-financial-loans-heading">
                                <div>
                                  <h5>
                                    Loan History
                                  </h5>

                                  <span>
                                    {
                                      customer.loans
                                        ?.length || 0
                                    }{" "}
                                    loan(s)
                                  </span>
                                </div>
                              </div>

                              {customer.loans?.length ? (
                                <div className="customer-financial-loans-table-wrapper">
                                  <table className="customer-financial-loans-table">
                                    <thead>
                                      <tr>
                                        <th>Loan</th>
                                        <th>
                                          Principal
                                        </th>
                                        <th>
                                          Interest
                                        </th>
                                        <th>
                                          Payable
                                        </th>
                                        <th>Paid</th>
                                        <th>
                                          Outstanding
                                        </th>
                                        <th>Status</th>
                                        <th>
                                          Repayment
                                        </th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {customer.loans.map(
                                        (loan) => (
                                          <tr
                                            key={
                                              loan.loan_id
                                            }
                                          >
                                            <td>
                                              <strong>
                                                Loan #
                                                {
                                                  loan.loan_id
                                                }
                                              </strong>

                                              <small>
                                                {
                                                  loan.interest_type
                                                }
                                              </small>
                                            </td>

                                            <td>
                                              {formatCurrency(
                                                loan.principal_amount
                                              )}
                                            </td>

                                            <td>
                                              <strong>
                                                {formatPercentage(
                                                  loan.interest_rate
                                                )}
                                              </strong>

                                              <small>
                                                {formatCurrency(
                                                  loan.total_interest
                                                )}
                                              </small>
                                            </td>

                                            <td>
                                              {formatCurrency(
                                                loan.total_payable
                                              )}
                                            </td>

                                            <td>
                                              {formatCurrency(
                                                loan.total_paid
                                              )}
                                            </td>

                                            <td>
                                              <strong>
                                                {formatCurrency(
                                                  loan.outstanding
                                                )}
                                              </strong>
                                            </td>

                                            <td>
                                              <span
                                                className={getStatusClass(
                                                  loan.status
                                                )}
                                              >
                                                {
                                                  loan.status
                                                }
                                              </span>
                                            </td>

                                            <td>
                                              <div className="customer-financial-loan-repayment">
                                                <strong>
                                                  {formatPercentage(
                                                    loan.repayment_percentage
                                                  )}
                                                </strong>

                                                <div className="customer-financial-mini-progress">
                                                  <div
                                                    className="customer-financial-mini-progress-fill"
                                                    style={{
                                                      width: `${Math.min(
                                                        Math.max(
                                                          Number(
                                                            loan.repayment_percentage ||
                                                              0
                                                          ),
                                                          0
                                                        ),
                                                        100
                                                      )}%`,
                                                    }}
                                                  />
                                                </div>

                                                <small>
                                                  {
                                                    loan.paid_installments
                                                  }{" "}
                                                  /{" "}
                                                  {
                                                    loan.total_installments
                                                  }{" "}
                                                  paid
                                                </small>
                                              </div>
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="customer-financial-no-loans">
                                  No loan history available.
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
        </section>
      )}

      {/* =====================================================
          DATE RANGE REPORT
          ===================================================== */}

      {dateRangeVisible && (
        <section
          id="date-range-report"
          className="reports-section date-range-report"
        >
          <div className="date-range-report-header">
            <div className="date-range-title-row">
              <div className="date-range-title-icon">
                <CalendarClock size={22} />
              </div>

              <div>
                <h2>Date Range Reports</h2>

                <p>
                  Analyze loans started and payments
                  collected during a selected date range.
                </p>
              </div>
            </div>

            <button
              className="date-range-refresh-button"
              onClick={fetchDateRangeReport}
              disabled={loadingDateRange}
            >
              <RefreshCw
                size={16}
                className={
                  loadingDateRange
                    ? "refresh-icon-spinning"
                    : ""
                }
              />

              {loadingDateRange
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {/* Date Filters */}

          <div className="date-range-filter-card">
            <div className="date-range-filter-heading">
              <div>
                <h3>Select Date Range</h3>

                <p>
                  Choose the period you want to analyze.
                </p>
              </div>
            </div>

            <div className="date-range-filter-grid">
              <div className="date-range-field">
                <label htmlFor="reports-from-date">
                  From Date
                </label>

                <input
                  id="reports-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setFromDate(event.target.value);
                    setDateRangeError("");
                  }}
                />
              </div>

              <div className="date-range-field">
                <label htmlFor="reports-to-date">
                  To Date
                </label>

                <input
                  id="reports-to-date"
                  type="date"
                  value={toDate}
                  onChange={(event) => {
                    setToDate(event.target.value);
                    setDateRangeError("");
                  }}
                />
              </div>

              <div className="date-range-action">
                <button
                  type="button"
                  onClick={fetchDateRangeReport}
                  disabled={loadingDateRange}
                >
                  <CalendarClock size={17} />

                  {loadingDateRange
                    ? "Generating..."
                    : "Generate Report"}
                </button>
              </div>
            </div>

            {dateRangeError && (
              <div className="date-range-error">
                <AlertTriangle size={18} />

                <span>{dateRangeError}</span>
              </div>
            )}
          </div>

          {/* Report Results */}

          {loadingDateRange && !dateRangeReport && (
            <div className="report-loading">
              Generating date range report...
            </div>
          )}

          {dateRangeReport && !loadingDateRange && (
            <>
              <div className="date-range-selected-period">
                <CalendarClock size={18} />

                <span>
                  Report period:
                  <strong>
                    {" "}
                    {formatDate(
                      dateRangeReport.date_range?.from_date
                    )}
                  </strong>
                  {" → "}
                  <strong>
                    {formatDate(
                      dateRangeReport.date_range?.to_date
                    )}
                  </strong>
                </span>
              </div>

              {/* Summary */}

              <div className="date-range-summary-grid">
                <div className="date-range-summary-card">
                  <div className="date-range-summary-icon date-range-icon-blue">
                    <CreditCard size={20} />
                  </div>

                  <div>
                    <span>Loans Started</span>

                    <strong>
                      {
                        dateRangeReport.summary
                          ?.total_loans || 0
                      }
                    </strong>
                  </div>
                </div>

                <div className="date-range-summary-card">
                  <div className="date-range-summary-icon date-range-icon-purple">
                    <IndianRupee size={20} />
                  </div>

                  <div>
                    <span>Principal Issued</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.total_principal
                      )}
                    </strong>
                  </div>
                </div>

                <div className="date-range-summary-card">
                  <div className="date-range-summary-icon date-range-icon-green">
                    <CheckCircle2 size={20} />
                  </div>

                  <div>
                    <span>Total Payments</span>

                    <strong>
                      {
                        dateRangeReport.summary
                          ?.total_payments || 0
                      }
                    </strong>
                  </div>
                </div>

                <div className="date-range-summary-card">
                  <div className="date-range-summary-icon date-range-icon-emerald">
                    <Banknote size={20} />
                  </div>

                  <div>
                    <span>Total Collected</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.total_collected
                      )}
                    </strong>
                  </div>
                </div>

                <div className="date-range-summary-card">
                  <div className="date-range-summary-icon date-range-icon-orange">
                    <Wallet size={20} />
                  </div>

                  <div>
                    <span>Average Payment</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.average_payment
                      )}
                    </strong>
                  </div>
                </div>

                <div className="date-range-summary-card">
                  <div className="date-range-summary-icon date-range-icon-cyan">
                    <WalletCards size={20} />
                  </div>

                  <div>
                    <span>Cash Collected</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.cash_collected
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}

              <div className="date-range-breakdown-section">
                <div className="date-range-subsection-heading">
                  <div>
                    <h3>Payment Method Breakdown</h3>

                    <p>
                      Collection split by payment method
                      during this period.
                    </p>
                  </div>
                </div>

                <div className="date-range-breakdown-grid">
                  <div className="date-range-breakdown-card">
                    <span>Cash</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.cash_collected
                      )}
                    </strong>

                    <small>
                      {
                        dateRangeReport.summary
                          ?.cash_count || 0
                      }{" "}
                      payments
                    </small>
                  </div>

                  <div className="date-range-breakdown-card">
                    <span>UPI</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.upi_collected
                      )}
                    </strong>

                    <small>
                      {
                        dateRangeReport.summary
                          ?.upi_count || 0
                      }{" "}
                      payments
                    </small>
                  </div>

                  <div className="date-range-breakdown-card">
                    <span>Bank</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.bank_collected
                      )}
                    </strong>

                    <small>
                      {
                        dateRangeReport.summary
                          ?.bank_count || 0
                      }{" "}
                      payments
                    </small>
                  </div>

                  <div className="date-range-breakdown-card">
                    <span>Other</span>

                    <strong>
                      {formatCurrency(
                        dateRangeReport.summary
                          ?.other_collected
                      )}
                    </strong>

                    <small>
                      {
                        dateRangeReport.summary
                          ?.other_count || 0
                      }{" "}
                      payments
                    </small>
                  </div>
                </div>
              </div>

              {/* Loans Started */}

              <div className="date-range-results-section">
                <div className="date-range-subsection-heading">
                  <div>
                    <h3>Loans Started During Period</h3>

                    <p>
                      Loans whose start date falls inside
                      the selected date range.
                    </p>
                  </div>

                  <span className="date-range-count-badge">
                    {
                      dateRangeReport.loans?.length || 0
                    }{" "}
                    Loans
                  </span>
                </div>

                <div className="date-range-table-wrapper">
                  <table className="date-range-table">
                    <thead>
                      <tr>
                        <th>Loan</th>
                        <th>Customer</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Type</th>
                        <th>Start Date</th>
                        <th>Maturity</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dateRangeReport.loans?.length >
                      0 ? (
                        dateRangeReport.loans.map(
                          (loan) => (
                            <tr key={loan.loan_id}>
                              <td>
                                <strong>
                                  Loan #{loan.loan_id}
                                </strong>
                              </td>

                              <td>
                                {loan.customer_name}
                              </td>

                              <td>
                                {formatCurrency(
                                  loan.principal_amount
                                )}
                              </td>

                              <td>
                                <strong>
                                  {formatPercentage(
                                    loan.interest_rate
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span className="date-range-type-badge">
                                  {loan.interest_type}
                                </span>
                              </td>

                              <td>
                                {formatDate(
                                  loan.start_date
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  loan.maturity_date
                                )}
                              </td>

                              <td>
                                <span
                                  className={getStatusClass(
                                    loan.status
                                  )}
                                >
                                  {loan.status}
                                </span>
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="8"
                            className="empty-report-cell"
                          >
                            No loans were started during
                            this date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payments During Period */}

              <div className="date-range-results-section">
                <div className="date-range-subsection-heading">
                  <div>
                    <h3>Payments During Period</h3>

                    <p>
                      All payments recorded between the
                      selected dates.
                    </p>
                  </div>

                  <span className="date-range-count-badge">
                    {
                      dateRangeReport.payments?.length ||
                      0
                    }{" "}
                    Payments
                  </span>
                </div>

                <div className="date-range-table-wrapper">
                  <table className="date-range-table">
                    <thead>
                      <tr>
                        <th>Payment</th>
                        <th>Customer</th>
                        <th>Loan</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Reference</th>
                      </tr>
                    </thead>

                    <tbody>
                      {dateRangeReport.payments?.length >
                      0 ? (
                        dateRangeReport.payments.map(
                          (payment) => (
                            <tr
                              key={
                                payment.payment_id
                              }
                            >
                              <td>
                                <strong>
                                  #
                                  {
                                    payment.payment_id
                                  }
                                </strong>
                              </td>

                              <td>
                                {
                                  payment.customer_name
                                }
                              </td>

                              <td>
                                Loan #
                                {payment.loan_id}
                              </td>

                              <td className="date-range-payment-amount">
                                {formatCurrency(
                                  payment.amount
                                )}
                              </td>

                              <td>
                                {formatDate(
                                  payment.payment_date
                                )}
                              </td>

                              <td>
                                <span
                                  className={getPaymentMethodClass(
                                    payment.payment_method
                                  )}
                                >
                                  {
                                    payment.payment_method
                                  }
                                </span>
                              </td>

                              <td>
                                {
                                  payment.reference_number ||
                                  "-"
                                }
                              </td>
                            </tr>
                          )
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="empty-report-cell"
                          >
                            No payments were recorded
                            during this date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* =====================================================
          INFO
          ===================================================== */}

      <div className="reports-info-box">
        <div className="reports-info-icon">
          <IndianRupee size={20} />
        </div>

        <div>
          <strong>
            Reports are based on current data
          </strong>

          <p>
            Financial values are calculated from the
            current loans, installments, and payment
            records in the system.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL REUSABLE ICON
   ========================================================= */

function ReceiptIcon() {
  return <CreditCard size={19} />;
}

export default Reports;