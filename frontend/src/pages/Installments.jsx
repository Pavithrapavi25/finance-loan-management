import { useEffect, useState } from "react";
import {
  Search,
  CalendarDays,
  Wallet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  User,
  XCircle,
  Eye,
  CreditCard,
  Receipt,
  X,
  Plus,
  IndianRupee,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

function Installments() {
  const { token } = useAuth();

  const [loans, setLoans] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [payments, setPayments] = useState([]);

  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingLoans, setLoadingLoans] = useState(true);
  const [loadingInstallments, setLoadingInstallments] =
    useState(false);
  const [loadingPayments, setLoadingPayments] =
    useState(false);

  const [error, setError] = useState("");
  const [paymentSuccess, setPaymentSuccess] =
    useState("");

  const [selectedInstallment, setSelectedInstallment] =
    useState(null);

  const [showPaymentForm, setShowPaymentForm] =
    useState(false);

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_date: new Date()
      .toISOString()
      .split("T")[0],
    payment_method: "Cash",
    reference_number: "",
    notes: "",
  });

  // =========================================
  // FETCH LOANS
  // =========================================

  const fetchLoans = async () => {
    try {
      setLoadingLoans(true);
      setError("");

      const response = await api.get("/loans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLoans(response.data);

      if (response.data.length > 0) {
        setSelectedLoanId(String(response.data[0].id));
      }
    } catch (error) {
      console.error("Fetch loans error:", error);

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Unable to load loans."
        );
      } else {
        setError("Cannot connect to the backend.");
      }
    } finally {
      setLoadingLoans(false);
    }
  };

  // =========================================
  // FETCH INSTALLMENTS
  // =========================================

  const fetchInstallments = async (loanId) => {
    if (!loanId) {
      setInstallments([]);
      return [];
    }

    try {
      setLoadingInstallments(true);
      setError("");

      const response = await api.get(
        `/installments/loan/${loanId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const latestInstallments = response.data;

      setInstallments(latestInstallments);

      // Keep selected installment synchronized with
      // the latest database values.
      setSelectedInstallment((previous) => {
        if (!previous) {
          return null;
        }

        const latest = latestInstallments.find(
          (item) =>
            Number(item.id) === Number(previous.id)
        );

        return latest || null;
      });

      return latestInstallments;
    } catch (error) {
      console.error(
        "Fetch installments error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Unable to load installments."
        );
      } else {
        setError("Cannot connect to the backend.");
      }

      setInstallments([]);
      return [];
    } finally {
      setLoadingInstallments(false);
    }
  };

  // =========================================
  // FETCH PAYMENTS
  // =========================================

  const fetchPayments = async () => {
    try {
      setLoadingPayments(true);

      const response = await api.get("/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPayments(response.data);
    } catch (error) {
      console.error(
        "Fetch payments error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Unable to load payment history."
        );
      } else {
        setError("Cannot connect to the backend.");
      }
    } finally {
      setLoadingPayments(false);
    }
  };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    if (token) {
      fetchLoans();
      fetchPayments();
    }
  }, [token]);

  // =========================================
  // LOAD INSTALLMENTS
  // =========================================

  useEffect(() => {
    if (token && selectedLoanId) {
      fetchInstallments(selectedLoanId);
    }
  }, [token, selectedLoanId]);

  // =========================================
  // HELPERS
  // =========================================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getDateOnly = (value) => {
    const date = new Date(value);

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  // =========================================
  // SAFE MONEY CONVERSION
  // =========================================

  const toMoney = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.round(
      (number + Number.EPSILON) * 100
    ) / 100;
  };

  const getRemainingAmount = (installment) => {
    if (!installment) return 0;

    const total = toMoney(
      installment.total_amount
    );

    const paid = toMoney(
      installment.paid_amount
    );

    return Math.max(
      toMoney(total - paid),
      0
    );
  };

  // =========================================
  // GET LATEST INSTALLMENT
  // =========================================

  const getLatestInstallment = (installmentId) => {
    if (!installmentId) return null;

    return (
      installments.find(
        (installment) =>
          Number(installment.id) ===
          Number(installmentId)
      ) || null
    );
  };

  // =========================================
  // STEP 4 — STATUS DETECTION
  // =========================================

  const getDisplayStatus = (installment) => {
    const remaining =
      getRemainingAmount(installment);

    if (remaining <= 0) {
      return "paid";
    }

    if (installment.status === "partial") {
      const today = getDateOnly(new Date());
      const dueDate = getDateOnly(
        installment.due_date
      );

      if (dueDate < today) {
        return "overdue";
      }

      if (dueDate.getTime() === today.getTime()) {
        return "due-today";
      }

      return "partial";
    }

    const today = getDateOnly(new Date());
    const dueDate = getDateOnly(
      installment.due_date
    );

    if (dueDate < today) {
      return "overdue";
    }

    if (dueDate.getTime() === today.getTime()) {
      return "due-today";
    }

    return "pending";
  };

  // =========================================
  // DAYS OVERDUE
  // =========================================

  const getDaysOverdue = (installment) => {
    const status =
      getDisplayStatus(installment);

    if (status !== "overdue") {
      return 0;
    }

    const today = getDateOnly(new Date());
    const dueDate = getDateOnly(
      installment.due_date
    );

    const difference =
      today.getTime() - dueDate.getTime();

    return Math.floor(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  // =========================================
  // DAYS UNTIL DUE
  // =========================================

  const getDaysUntilDue = (installment) => {
    const status =
      getDisplayStatus(installment);

    if (
      status === "paid" ||
      status === "overdue" ||
      status === "due-today"
    ) {
      return 0;
    }

    const today = getDateOnly(new Date());
    const dueDate = getDateOnly(
      installment.due_date
    );

    const difference =
      dueDate.getTime() - today.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  // =========================================
  // STATUS ICON
  // =========================================

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 size={15} />;

      case "partial":
        return <Clock3 size={15} />;

      case "overdue":
        return <AlertTriangle size={15} />;

      case "due-today":
        return <AlertTriangle size={15} />;

      default:
        return <Clock3 size={15} />;
    }
  };

  // =========================================
  // STATUS LABEL
  // =========================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "paid":
        return "Paid";

      case "partial":
        return "Partial";

      case "overdue":
        return "Overdue";

      case "due-today":
        return "Due Today";

      default:
        return "Pending";
    }
  };

  // =========================================
  // SELECTED LOAN
  // =========================================

  const selectedLoan = loans.find(
    (loan) =>
      String(loan.id) ===
      String(selectedLoanId)
  );

  // =========================================
  // SEARCH
  // =========================================

  const filteredInstallments =
    installments.filter((installment) => {
      const status =
        getDisplayStatus(installment);

      const search =
        searchTerm.toLowerCase().trim();

      if (!search) return true;

      return (
        String(
          installment.installment_number
        ).includes(search) ||
        formatDate(installment.due_date)
          .toLowerCase()
          .includes(search) ||
        status.includes(search) ||
        getStatusLabel(status)
          .toLowerCase()
          .includes(search)
      );
    });

  // =========================================
  // SUMMARY
  // =========================================

  const totalInstallments =
    installments.length;

  const paidInstallments =
    installments.filter(
      (installment) =>
        getDisplayStatus(installment) === "paid"
    ).length;

  const partialInstallments =
    installments.filter(
      (installment) =>
        getDisplayStatus(installment) === "partial"
    ).length;

  const overdueInstallments =
    installments.filter(
      (installment) =>
        getDisplayStatus(installment) === "overdue"
    ).length;

  const dueTodayInstallments =
    installments.filter(
      (installment) =>
        getDisplayStatus(installment) ===
        "due-today"
    ).length;

  const pendingInstallments =
    installments.filter(
      (installment) =>
        getDisplayStatus(installment) === "pending"
    ).length;

  const totalPayable = installments.reduce(
    (sum, installment) =>
      sum +
      Number(installment.total_amount || 0),
    0
  );

  const totalPaid = installments.reduce(
    (sum, installment) =>
      sum +
      Number(installment.paid_amount || 0),
    0
  );

  const totalRemaining = installments.reduce(
    (sum, installment) =>
      sum + getRemainingAmount(installment),
    0
  );

  // =========================================
  // PAYMENT HISTORY
  // =========================================

  const installmentPayments =
    selectedInstallment
      ? payments
          .filter(
            (payment) =>
              Number(payment.loan_id) ===
                Number(selectedLoanId) &&
              Number(payment.installment_id) ===
                Number(selectedInstallment.id)
          )
          .sort((a, b) => {
            return (
              new Date(b.payment_date) -
              new Date(a.payment_date)
            );
          })
      : [];

  const installmentPaymentTotal =
    installmentPayments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  // =========================================
  // VIEW PAYMENT HISTORY
  // =========================================

  const handleViewPayments = (installment) => {
    const latestInstallment =
      getLatestInstallment(installment.id) ||
      installment;

    setSelectedInstallment(
      latestInstallment
    );

    setPaymentError("");
  };

  const handleClosePayments = () => {
    setSelectedInstallment(null);
  };

  // =========================================
  // OPEN PAYMENT FORM
  // =========================================

  const handleOpenPaymentForm = (installment) => {
    // Always get the newest version from the
    // current installments state.
    const latestInstallment =
      getLatestInstallment(installment.id) ||
      installment;

    const remaining =
      getRemainingAmount(
        latestInstallment
      );

    if (remaining <= 0) return;

    setSelectedInstallment(
      latestInstallment
    );

    setPaymentForm({
      amount: remaining.toFixed(2),

      payment_date: new Date()
        .toISOString()
        .split("T")[0],

      payment_method: "Cash",

      reference_number: "",

      notes: "",
    });

    setPaymentError("");
    setPaymentSuccess("");
    setShowPaymentForm(true);
  };

  // =========================================
  // CLOSE PAYMENT FORM
  // =========================================

  const handleClosePaymentForm = () => {
    if (paymentLoading) return;

    setShowPaymentForm(false);
    setPaymentError("");
  };

  // =========================================
  // PAYMENT INPUT
  // =========================================

  const handlePaymentChange = (event) => {
    const { name, value } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPaymentError("");
  };

  // =========================================
  // SUBMIT PAYMENT
  // =========================================

  const handleSubmitPayment = async (event) => {
    event.preventDefault();

    if (!selectedInstallment) return;

    setPaymentError("");
    setPaymentSuccess("");

    const amount = toMoney(
      paymentForm.amount
    );

    // Always use the latest installment from
    // the current state.
    const latestInstallment =
      getLatestInstallment(
        selectedInstallment.id
      ) || selectedInstallment;

    const remaining =
      toMoney(
        getRemainingAmount(
          latestInstallment
        )
      );

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentError(
        "Please enter a valid payment amount."
      );
      return;
    }

    // Compare rounded money values instead of
    // relying on browser native max validation.
    if (
      Math.round(amount * 100) >
      Math.round(remaining * 100)
    ) {
      setPaymentError(
        `Payment cannot exceed the remaining amount of ${formatCurrency(
          remaining
        )}.`
      );
      return;
    }

    if (!paymentForm.payment_date) {
      setPaymentError(
        "Please select a payment date."
      );
      return;
    }

    if (!paymentForm.payment_method) {
      setPaymentError(
        "Please select a payment method."
      );
      return;
    }

    try {
      setPaymentLoading(true);

      await api.post(
        "/payments",
        {
          loan_id: Number(selectedLoanId),

          installment_id:
            Number(latestInstallment.id),

          amount: amount.toFixed(2),

          payment_date:
            paymentForm.payment_date,

          payment_method:
            paymentForm.payment_method,

          reference_number:
            paymentForm.reference_number.trim() ||
            null,

          notes:
            paymentForm.notes.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPaymentSuccess(
        "Payment recorded successfully."
      );

      // Refresh both payment history and
      // installment data.
      await fetchPayments();

      const latestInstallments =
        await fetchInstallments(
          selectedLoanId
        );

      // Update selected installment using
      // the newly fetched database record.
      const refreshedInstallment =
        latestInstallments.find(
          (item) =>
            Number(item.id) ===
            Number(latestInstallment.id)
        );

      if (refreshedInstallment) {
        setSelectedInstallment(
          refreshedInstallment
        );
      }

      setShowPaymentForm(false);

    } catch (error) {
      console.error(
        "Create payment error:",
        error
      );

      if (error.response) {
        setPaymentError(
          error.response.data.detail ||
            "Unable to record payment."
        );
      } else {
        setPaymentError(
          "Cannot connect to the backend."
        );
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loadingLoans) {
    return (
      <div className="installments-loading">
        <Loader2
          size={28}
          className="loading-spinner"
        />
        <p>Loading installments...</p>
      </div>
    );
  }

  return (
    <div className="installments-page">

      {/* HEADER */}

      <div className="installments-header">
        <div>
          <h1>Installments</h1>

          <p>
            Track repayment schedules and
            installment status
          </p>
        </div>

        <div className="installments-header-icon">
          <CalendarDays size={22} />
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="installments-error">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="installments-error-close"
          >
            <XCircle size={17} />
          </button>
        </div>
      )}

      {/* SUCCESS */}

      {paymentSuccess && (
        <div className="installments-success">
          <CheckCircle2 size={18} />

          <span>{paymentSuccess}</span>

          <button
            type="button"
            onClick={() =>
              setPaymentSuccess("")
            }
            className="installments-success-close"
          >
            <XCircle size={17} />
          </button>
        </div>
      )}

      {/* LOAN SELECTOR */}

      <div className="installment-selector-card">

        <div className="installment-selector-left">

          <div className="installment-selector-icon">
            <Wallet size={20} />
          </div>

          <div>
            <h2>Select Loan</h2>

            <p>
              Choose a loan to view its repayment
              schedule
            </p>
          </div>

        </div>

        <div className="installment-selector-control">

          <label htmlFor="loan-select">
            Loan
          </label>

          <select
            id="loan-select"
            value={selectedLoanId}
            onChange={(event) => {
              setSelectedLoanId(
                event.target.value
              );

              setSearchTerm("");
              setSelectedInstallment(null);
              setShowPaymentForm(false);
            }}
          >
            <option value="">
              Select a loan
            </option>

            {loans.map((loan) => (
              <option
                key={loan.id}
                value={loan.id}
              >
                Loan #{loan.id} —{" "}
                {formatCurrency(
                  loan.principal_amount
                )}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* SELECTED LOAN */}

      {selectedLoan && (
        <div className="selected-loan-card">

          <div className="selected-loan-info">

            <div className="selected-loan-icon">
              <User size={19} />
            </div>

            <div>
              <span>Selected Loan</span>

              <strong>
                Loan #{selectedLoan.id}
              </strong>
            </div>

          </div>

          <div className="selected-loan-details">

            <div>
              <span>Principal</span>

              <strong>
                {formatCurrency(
                  selectedLoan.principal_amount
                )}
              </strong>
            </div>

            <div>
              <span>Interest Rate</span>

              <strong>
                {selectedLoan.interest_rate}%
              </strong>
            </div>

            <div>
              <span>Tenure</span>

              <strong>
                {selectedLoan.tenure_months} months
              </strong>
            </div>

            <div>
              <span>Status</span>

              <strong className="loan-status-active">
                {selectedLoan.status}
              </strong>
            </div>

          </div>

        </div>
      )}

      {/* SUMMARY */}

      {selectedLoanId && (
        <div className="installment-summary-grid">

          <div className="installment-summary-card">
            <div className="summary-card-icon">
              <CalendarDays size={19} />
            </div>

            <div>
              <span>Total Installments</span>
              <strong>
                {totalInstallments}
              </strong>
            </div>
          </div>

          <div className="installment-summary-card">
            <div className="summary-card-icon">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <span>Paid</span>
              <strong>
                {paidInstallments}
              </strong>
            </div>
          </div>

          <div className="installment-summary-card">
            <div className="summary-card-icon">
              <Clock3 size={19} />
            </div>

            <div>
              <span>Partial</span>
              <strong>
                {partialInstallments}
              </strong>
            </div>
          </div>

          <div className="installment-summary-card overdue-summary-card">
            <div className="summary-card-icon">
              <AlertTriangle size={19} />
            </div>

            <div>
              <span>Overdue</span>
              <strong>
                {overdueInstallments}
              </strong>
            </div>
          </div>

          <div className="installment-summary-card due-today-summary-card">
            <div className="summary-card-icon">
              <AlertTriangle size={19} />
            </div>

            <div>
              <span>Due Today</span>
              <strong>
                {dueTodayInstallments}
              </strong>
            </div>
          </div>

          <div className="installment-summary-card">
            <div className="summary-card-icon">
              <Clock3 size={19} />
            </div>

            <div>
              <span>Pending</span>
              <strong>
                {pendingInstallments}
              </strong>
            </div>
          </div>

        </div>
      )}

      {/* FINANCIAL SUMMARY */}

      {selectedLoanId &&
        !loadingInstallments &&
        installments.length > 0 && (
          <div className="installment-financial-card">

            <div className="financial-item">
              <span>Total Payable</span>

              <strong>
                {formatCurrency(totalPayable)}
              </strong>
            </div>

            <div className="financial-divider" />

            <div className="financial-item">
              <span>Total Paid</span>

              <strong>
                {formatCurrency(totalPaid)}
              </strong>
            </div>

            <div className="financial-divider" />

            <div className="financial-item">
              <span>Remaining</span>

              <strong>
                {formatCurrency(totalRemaining)}
              </strong>
            </div>

          </div>
        )}

      {/* TABLE */}

      <div className="installments-table-card">

        <div className="installments-table-header">

          <div>
            <h2>Repayment Schedule</h2>

            <p>
              Detailed installment schedule for
              the selected loan
            </p>
          </div>

          <div className="installments-count">
            {filteredInstallments.length}{" "}
            Installments
          </div>

        </div>

        <div className="installments-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search by installment, due date or status..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

        </div>

        {loadingInstallments ? (
          <div className="installments-loading-table">

            <Loader2
              size={25}
              className="loading-spinner"
            />

            <p>
              Loading repayment schedule...
            </p>

          </div>
        ) : !selectedLoanId ? (
          <div className="installments-empty">

            <Wallet size={38} />

            <h3>Select a loan</h3>

            <p>
              Select a loan above to view its
              installment schedule.
            </p>

          </div>
        ) : filteredInstallments.length === 0 ? (
          <div className="installments-empty">

            <CalendarDays size={38} />

            <h3>No installments found</h3>

            <p>
              This loan does not have any
              installments available.
            </p>

          </div>
        ) : (
          <div className="installments-table-wrapper">

            <table className="installments-table">

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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredInstallments.map(
                  (installment) => {
                    const status =
                      getDisplayStatus(
                        installment
                      );

                    const remaining =
                      getRemainingAmount(
                        installment
                      );

                    const daysOverdue =
                      getDaysOverdue(
                        installment
                      );

                    const daysUntilDue =
                      getDaysUntilDue(
                        installment
                      );

                    return (
                      <tr
                        key={installment.id}
                        className={`installment-row-${status}`}
                      >

                        <td>
                          <strong>
                            #
                            {
                              installment.installment_number
                            }
                          </strong>
                        </td>

                        <td>
                          <div className="date-cell">

                            <CalendarDays
                              size={14}
                            />

                            <div className="due-date-wrapper">

                              <span>
                                {formatDate(
                                  installment.due_date
                                )}
                              </span>

                              {status ===
                                "overdue" && (
                                <small className="overdue-days">
                                  Overdue by{" "}
                                  {daysOverdue}{" "}
                                  day
                                  {daysOverdue !== 1
                                    ? "s"
                                    : ""}
                                </small>
                              )}

                              {status ===
                                "due-today" && (
                                <small className="due-today-label">
                                  Due today
                                </small>
                              )}

                              {status ===
                                "pending" &&
                                daysUntilDue <= 7 && (
                                <small className="due-soon-label">
                                  Due in{" "}
                                  {daysUntilDue}{" "}
                                  day
                                  {daysUntilDue !== 1
                                    ? "s"
                                    : ""}
                                </small>
                              )}

                            </div>

                          </div>
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
                          <strong
                            className={
                              status === "overdue"
                                ? "remaining-overdue"
                                : ""
                            }
                          >
                            {formatCurrency(
                              remaining
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`installment-status status-${status}`}
                          >
                            {getStatusIcon(status)}

                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td>
                          <div className="installment-actions">

                            <button
                              type="button"
                              className="installment-view-button"
                              onClick={() =>
                                handleViewPayments(
                                  installment
                                )
                              }
                            >
                              <Eye size={14} />
                              View
                            </button>

                            {remaining > 0 && (
                              <button
                                type="button"
                                className="installment-add-payment-button"
                                onClick={() =>
                                  handleOpenPaymentForm(
                                    installment
                                  )
                                }
                              >
                                <Plus size={14} />
                                Add Payment
                              </button>
                            )}

                          </div>
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

      {/* =====================================
          PAYMENT HISTORY MODAL
      ===================================== */}

      {selectedInstallment &&
        !showPaymentForm && (
          <div
            className="payment-history-overlay"
            onClick={handleClosePayments}
          >

            <div
              className="payment-history-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="payment-history-header">

                <div className="payment-history-title">

                  <div className="payment-history-icon">
                    <Receipt size={21} />
                  </div>

                  <div>
                    <h2>
                      Installment #
                      {
                        selectedInstallment.installment_number
                      }
                    </h2>

                    <p>
                      Payment history
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  className="payment-history-close"
                  onClick={handleClosePayments}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="payment-history-summary">

                <div>
                  <span>Total</span>

                  <strong>
                    {formatCurrency(
                      selectedInstallment.total_amount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Paid</span>

                  <strong>
                    {formatCurrency(
                      selectedInstallment.paid_amount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>

                  <strong>
                    {formatCurrency(
                      getRemainingAmount(
                        selectedInstallment
                      )
                    )}
                  </strong>
                </div>

                <div>
                  <span>Status</span>

                  <strong className="modal-status">
                    {getStatusLabel(
                      getDisplayStatus(
                        selectedInstallment
                      )
                    )}
                  </strong>
                </div>

              </div>

              <div className="payment-history-content">

                <div className="payment-history-section-header">

                  <div>
                    <h3>
                      Payment History
                    </h3>

                    <p>
                      {installmentPayments.length}{" "}
                      payment
                      {installmentPayments.length !==
                      1
                        ? "s"
                        : ""}{" "}
                      recorded
                    </p>
                  </div>

                  {loadingPayments && (
                    <Loader2
                      size={18}
                      className="loading-spinner"
                    />
                  )}

                </div>

                {installmentPayments.length === 0 ? (
                  <div className="payment-history-empty">

                    <CreditCard size={34} />

                    <h3>
                      No payments recorded
                    </h3>

                    <p>
                      No payment has been recorded
                      for this installment yet.
                    </p>

                  </div>
                ) : (
                  <>
                    <div className="payment-history-list">

                      {installmentPayments.map(
                        (payment) => (
                          <div
                            className="payment-history-item"
                            key={payment.id}
                          >

                            <div className="payment-history-item-icon">
                              <CreditCard size={17} />
                            </div>

                            <div className="payment-history-item-info">

                              <strong>
                                {formatCurrency(
                                  payment.amount
                                )}
                              </strong>

                              <span>
                                {formatDate(
                                  payment.payment_date
                                )}
                              </span>

                            </div>

                            <div className="payment-history-item-method">

                              <span>
                                Payment Method
                              </span>

                              <strong>
                                {
                                  payment.payment_method
                                }
                              </strong>

                            </div>

                            <div className="payment-history-item-reference">

                              <span>
                                Reference
                              </span>

                              <strong>
                                {
                                  payment.reference_number ||
                                  "-"
                                }
                              </strong>

                            </div>

                          </div>
                        )
                      )}

                    </div>

                    <div className="payment-history-total">

                      <span>
                        Total Payments
                      </span>

                      <strong>
                        {formatCurrency(
                          installmentPaymentTotal
                        )}
                      </strong>

                    </div>
                  </>
                )}

              </div>

              <div className="payment-history-footer">

                <span>
                  Due date:{" "}
                  <strong>
                    {formatDate(
                      selectedInstallment.due_date
                    )}
                  </strong>
                </span>

                <div className="payment-history-footer-actions">

                  {getRemainingAmount(
                    selectedInstallment
                  ) > 0 && (
                    <button
                      type="button"
                      className="modal-add-payment-button"
                      onClick={() =>
                        handleOpenPaymentForm(
                          selectedInstallment
                        )
                      }
                    >
                      <Plus size={15} />
                      Add Payment
                    </button>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleClosePayments}
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

      {/* =====================================
          ADD PAYMENT MODAL
      ===================================== */}

      {selectedInstallment &&
        showPaymentForm && (
          <div
            className="payment-form-overlay"
            onClick={handleClosePaymentForm}
          >

            <div
              className="payment-form-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="payment-form-header">

                <div className="payment-form-title">

                  <div className="payment-form-icon">
                    <IndianRupee size={21} />
                  </div>

                  <div>
                    <h2>Add Payment</h2>

                    <p>
                      Installment #
                      {
                        selectedInstallment.installment_number
                      }
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  className="payment-history-close"
                  onClick={handleClosePaymentForm}
                  disabled={paymentLoading}
                >
                  <X size={20} />
                </button>

              </div>

              <div className="payment-form-installment-info">

                <div>
                  <span>Loan</span>

                  <strong>
                    Loan #{selectedLoanId}
                  </strong>
                </div>

                <div>
                  <span>Due Date</span>

                  <strong>
                    {formatDate(
                      selectedInstallment.due_date
                    )}
                  </strong>
                </div>

                <div>
                  <span>Total</span>

                  <strong>
                    {formatCurrency(
                      selectedInstallment.total_amount
                    )}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>

                  <strong className="remaining-highlight">
                    {formatCurrency(
                      getRemainingAmount(
                        selectedInstallment
                      )
                    )}
                  </strong>
                </div>

              </div>

              {paymentError && (
                <div className="payment-form-error">

                  <AlertCircle size={17} />

                  <span>{paymentError}</span>

                </div>
              )}

              <form
                className="payment-form"
                onSubmit={handleSubmitPayment}
              >

                <div className="payment-form-grid">

                  {/* PAYMENT AMOUNT */}

                  <div className="payment-form-group">

                    <label htmlFor="payment-amount">
                      Payment Amount
                    </label>

                    <div className="payment-input-wrapper">

                      <span className="payment-currency">
                        ₹
                      </span>

                      <input
                        id="payment-amount"
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          paymentForm.amount
                        }
                        onChange={
                          handlePaymentChange
                        }
                        placeholder="Enter amount"
                        required
                        disabled={paymentLoading}
                        inputMode="decimal"
                      />

                    </div>

                    <small className="payment-maximum-text">
                      Maximum payable:{" "}
                      {formatCurrency(
                        getRemainingAmount(
                          selectedInstallment
                        )
                      )}
                    </small>

                  </div>

                  {/* PAYMENT DATE */}

                  <div className="payment-form-group">

                    <label htmlFor="payment-date">
                      Payment Date
                    </label>

                    <div className="payment-input-wrapper">

                      <CalendarDays
                        size={17}
                        className="payment-input-icon"
                      />

                      <input
                        id="payment-date"
                        name="payment_date"
                        type="date"
                        value={
                          paymentForm.payment_date
                        }
                        onChange={
                          handlePaymentChange
                        }
                        required
                        disabled={paymentLoading}
                      />

                    </div>

                  </div>

                  {/* PAYMENT METHOD */}

                  <div className="payment-form-group">

                    <label htmlFor="payment-method">
                      Payment Method
                    </label>

                    <div className="payment-input-wrapper">

                      <CreditCard
                        size={17}
                        className="payment-input-icon"
                      />

                      <select
                        id="payment-method"
                        name="payment_method"
                        value={
                          paymentForm.payment_method
                        }
                        onChange={
                          handlePaymentChange
                        }
                        required
                        disabled={paymentLoading}
                      >
                        <option value="Cash">
                          Cash
                        </option>

                        <option value="UPI">
                          UPI
                        </option>

                        <option value="Bank Transfer">
                          Bank Transfer
                        </option>

                        <option value="Cheque">
                          Cheque
                        </option>
                      </select>

                    </div>

                  </div>

                  {/* REFERENCE */}

                  <div className="payment-form-group">

                    <label htmlFor="reference-number">

                      Reference Number

                      <span className="optional-label">
                        Optional
                      </span>

                    </label>

                    <input
                      id="reference-number"
                      name="reference_number"
                      type="text"
                      value={
                        paymentForm.reference_number
                      }
                      onChange={
                        handlePaymentChange
                      }
                      placeholder="e.g. UPI transaction ID"
                      disabled={paymentLoading}
                    />

                  </div>

                  {/* NOTES */}

                  <div className="payment-form-group payment-form-full">

                    <label htmlFor="payment-notes">

                      Notes

                      <span className="optional-label">
                        Optional
                      </span>

                    </label>

                    <textarea
                      id="payment-notes"
                      name="notes"
                      rows="3"
                      value={paymentForm.notes}
                      onChange={
                        handlePaymentChange
                      }
                      placeholder="Add payment notes..."
                      disabled={paymentLoading}
                    />

                  </div>

                </div>

                <div className="payment-form-footer">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      handleClosePaymentForm
                    }
                    disabled={paymentLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="submit-payment-button"
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2
                          size={16}
                          className="loading-spinner"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Record Payment
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

    </div>
  );
}

export default Installments;