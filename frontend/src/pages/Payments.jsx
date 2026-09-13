import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Wallet,
  Loader2,
  AlertCircle,
  Receipt,
  CalendarDays,
  CreditCard,
  Plus,
  X,
  User,
  Filter,
  IndianRupee,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

function Payments() {
  const { token } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [installmentsLoading, setInstallmentsLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showForm, setShowForm] = useState(false);

  // =========================================
  // PAYMENT DETAILS
  // =========================================

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [formData, setFormData] = useState({
    loan_id: "",
    installment_id: "",
    amount: "",
    payment_date: new Date()
      .toISOString()
      .split("T")[0],
    payment_method: "Cash",
    reference_number: "",
    notes: "",
  });

  // =========================================
  // FETCH PAYMENTS
  // =========================================

  const fetchPayments = async () => {
    try {
      const response = await api.get("/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPayments(response.data);
    } catch (error) {
      console.error("Fetch payments error:", error);

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Unable to load payments."
        );
      } else {
        setError("Cannot connect to the backend.");
      }
    }
  };

  // =========================================
  // FETCH LOANS
  // =========================================

  const fetchLoans = async () => {
    try {
      const response = await api.get("/loans", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLoans(response.data);
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
    }
  };

  // =========================================
  // FETCH CUSTOMERS
  // =========================================

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data);
    } catch (error) {
      console.error(
        "Fetch customers error:",
        error
      );

      if (error.response) {
        setError(
          error.response.data.detail ||
            "Unable to load customers."
        );
      } else {
        setError("Cannot connect to the backend.");
      }
    }
  };

  // =========================================
  // FETCH INSTALLMENTS
  // =========================================

  const fetchInstallments = async (loanId) => {
    if (!loanId) {
      setInstallments([]);
      return;
    }

    try {
      setInstallmentsLoading(true);

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
        setFormError(
          error.response.data.detail ||
            "Unable to load installments."
        );
      } else {
        setFormError(
          "Cannot connect to the backend."
        );
      }

      setInstallments([]);
    } finally {
      setInstallmentsLoading(false);
    }
  };

  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchPayments(),
          fetchLoans(),
          fetchCustomers(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // =========================================
  // FORM LOAN CHANGE
  // =========================================

  const handleLoanChange = async (event) => {
    const loanId = event.target.value;

    setFormData((previous) => ({
      ...previous,
      loan_id: loanId,
      installment_id: "",
      amount: "",
    }));

    setFormError("");

    if (loanId) {
      await fetchInstallments(loanId);
    } else {
      setInstallments([]);
    }
  };

  // =========================================
  // INSTALLMENT CHANGE
  // =========================================

  const handleInstallmentChange = (event) => {
    const installmentId = event.target.value;

    const selectedInstallment =
      installments.find(
        (installment) =>
          String(installment.id) ===
          String(installmentId)
      );

    let amount = "";

    if (selectedInstallment) {
      const remaining = Math.max(
        Number(
          selectedInstallment.total_amount || 0
        ) -
          Number(
            selectedInstallment.paid_amount || 0
          ),
        0
      );

      if (remaining > 0) {
        amount = remaining.toFixed(2);
      }
    }

    setFormData((previous) => ({
      ...previous,
      installment_id: installmentId,
      amount,
    }));

    setFormError("");
  };

  // =========================================
  // FORM INPUT CHANGE
  // =========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  // =========================================
  // OPEN FORM
  // =========================================

  const handleOpenForm = () => {
    setFormError("");
    setSuccessMessage("");

    setFormData({
      loan_id: "",
      installment_id: "",
      amount: "",
      payment_date: new Date()
        .toISOString()
        .split("T")[0],
      payment_method: "Cash",
      reference_number: "",
      notes: "",
    });

    setInstallments([]);
    setShowForm(true);
  };

  // =========================================
  // CLOSE FORM
  // =========================================

  const handleCloseForm = () => {
    if (formLoading) return;

    setShowForm(false);
    setFormError("");
  };

  // =========================================
  // SUBMIT PAYMENT
  // =========================================
   
  const handleSubmit = async (event) => {
  event.preventDefault();

  setFormError("");
  setSuccessMessage("");

  const amount = Number(formData.amount);

  if (!formData.loan_id) {
    setFormError("Please select a loan.");
    return;
  }

  if (!formData.installment_id) {
    setFormError("Please select an installment.");
    return;
  }

  if (!amount || amount <= 0) {
    setFormError("Please enter a valid payment amount.");
    return;
  }

  const selectedInstallment = installments.find(
    (installment) =>
      String(installment.id) === String(formData.installment_id)
  );

  if (!selectedInstallment) {
    setFormError("Selected installment could not be found.");
    return;
  }

  const remaining = Math.max(
    Number(selectedInstallment.total_amount || 0) -
      Number(selectedInstallment.paid_amount || 0),
    0
  );

  if (remaining <= 0) {
    setFormError("This installment is already fully paid.");
    return;
  }

  if (amount > remaining) {
    setFormError(
      `Payment cannot exceed the remaining amount of ₹${remaining.toFixed(2)}.`
    );
    return;
  }

  if (!formData.payment_date) {
    setFormError("Please select a payment date.");
    return;
  }

  if (!formData.payment_method) {
    setFormError("Please select a payment method.");
    return;
  }

  try {
    setFormLoading(true);

    await api.post(
      "/payments",
      {
        loan_id: Number(formData.loan_id),
        installment_id: Number(formData.installment_id),
        amount: amount.toFixed(2),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference_number:
          formData.reference_number.trim() || null,
        notes: formData.notes.trim() || null,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSuccessMessage("Payment recorded successfully.");
    setShowForm(false);

    await fetchPayments();
    await fetchInstallments(formData.loan_id);

  } catch (error) {
    console.error("Create payment error:", error);

    // =========================================
    // BACKEND VALIDATION ERROR (422)
    // =========================================

    if (
      error.response?.status === 422 &&
      Array.isArray(error.response.data?.detail)
    ) {
      const validationError = error.response.data.detail[0];

      setFormError(
        validationError?.msg ||
          "Please check the payment details."
      );

      return;
    }

    // =========================================
    // NORMAL BACKEND ERROR
    // =========================================

    if (error.response?.data?.detail) {
      setFormError(
        typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : "Unable to record payment."
      );

      return;
    }

    // =========================================
    // CONNECTION ERROR
    // =========================================

    if (!error.response) {
      setFormError("Cannot connect to the backend.");
      return;
    }

    setFormError("Unable to record payment.");

  } finally {
    setFormLoading(false);
  }
};

  // =========================================
  // LOOKUP HELPERS
  // =========================================

  const getLoanById = (loanId) => {
    return loans.find(
      (loan) =>
        Number(loan.id) === Number(loanId)
    );
  };

  const getCustomerById = (customerId) => {
    return customers.find(
      (customer) =>
        Number(customer.id) ===
        Number(customerId)
    );
  };

  const getCustomerName = (loanId) => {
    const loan = getLoanById(loanId);

    if (!loan) {
      return `Loan #${loanId}`;
    }

    const customer = getCustomerById(
      loan.customer_id
    );

    return (
      customer?.full_name ||
      customer?.name ||
      `Customer #${loan.customer_id}`
    );
  };

  const getInstallmentById = (installmentId) => {
    return installments.find(
      (installment) =>
        Number(installment.id) ===
        Number(installmentId)
    );
  };

  const getRemainingInstallmentAmount = (
    installment
  ) => {
    if (!installment) return 0;

    return Math.max(
      Number(installment.total_amount || 0) -
        Number(installment.paid_amount || 0),
      0
    );
  };

  // =========================================
  // FORMATTERS
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

  // =========================================
  // PAYMENT DETAILS LOOKUPS
  // =========================================

  const loanForPayment = selectedPayment
    ? getLoanById(selectedPayment.loan_id)
    : null;

  const installmentForPayment = selectedPayment
    ? getInstallmentById(
        selectedPayment.installment_id
      )
    : null;

  // =========================================
  // OPEN PAYMENT DETAILS
  // =========================================

  const handleViewPayment = async (payment) => {
    setSelectedPayment(payment);

    const loan = getLoanById(payment.loan_id);

    if (!loan) {
      return;
    }

    const loanInstallments =
      installments.filter(
        (installment) =>
          Number(installment.loan_id) ===
          Number(payment.loan_id)
      );

    if (loanInstallments.length > 0) {
      return;
    }

    try {
      const response = await api.get(
        `/installments/loan/${payment.loan_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setInstallments((previous) => {
        const otherInstallments =
          previous.filter(
            (installment) =>
              Number(installment.loan_id) !==
              Number(payment.loan_id)
          );

        return [
          ...otherInstallments,
          ...response.data,
        ];
      });
    } catch (error) {
      console.error(
        "Fetch payment installment details error:",
        error
      );
    }
  };

  const handleClosePaymentDetails = () => {
    setSelectedPayment(null);
  };

  // =========================================
  // STEP 5.1 — FILTER PAYMENTS
  // =========================================

  const filteredPayments = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return payments.filter((payment) => {
      const loan = getLoanById(
        payment.loan_id
      );

      const customerName =
        getCustomerName(payment.loan_id);

      const matchesMethod =
        methodFilter === "All" ||
        payment.payment_method ===
          methodFilter;

      const searchableText = [
        payment.id,
        payment.loan_id,
        payment.installment_id,
        payment.payment_method,
        payment.reference_number,
        payment.notes,
        payment.payment_date,
        customerName,
        loan?.purpose,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search ||
        searchableText.includes(search);

      return (
        matchesMethod && matchesSearch
      );
    });
  }, [
    payments,
    loans,
    customers,
    searchTerm,
    methodFilter,
  ]);

  // =========================================
  // STEP 5.1 — SUMMARY
  // =========================================

  const totalPayments = payments.length;

  const totalCollected = payments.reduce(
    (sum, payment) =>
      sum + Number(payment.amount || 0),
    0
  );

  const cashCollected = payments
    .filter(
      (payment) =>
        payment.payment_method === "Cash"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const upiCollected = payments
    .filter(
      (payment) =>
        payment.payment_method === "UPI"
    )
    .reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  // =========================================
  // LOADING SCREEN
  // =========================================

  if (loading) {
    return (
      <div className="payments-loading">
        <Loader2
          size={28}
          className="loading-spinner"
        />

        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="payments-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="payments-header">

        <div>
          <h1>Payments</h1>

          <p>
            Track and manage loan payment
            collections
          </p>
        </div>

        <button
          type="button"
          className="add-payment-button"
          onClick={handleOpenForm}
        >
          <Plus size={17} />
          Add Payment
        </button>

      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="payments-error">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================
          SUCCESS
      ===================================== */}

      {successMessage && (
        <div className="payments-success">

          <Receipt size={18} />

          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================
          SUMMARY CARDS
      ===================================== */}

      <div className="payments-summary-grid">

        <div className="payment-summary-card">

          <div className="payment-summary-icon">
            <Receipt size={20} />
          </div>

          <div>
            <span>Total Payments</span>
            <strong>{totalPayments}</strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="payment-summary-icon">
            <IndianRupee size={20} />
          </div>

          <div>
            <span>Total Collected</span>
            <strong>
              {formatCurrency(totalCollected)}
            </strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="payment-summary-icon">
            <Wallet size={20} />
          </div>

          <div>
            <span>Cash Collected</span>
            <strong>
              {formatCurrency(cashCollected)}
            </strong>
          </div>

        </div>

        <div className="payment-summary-card">

          <div className="payment-summary-icon">
            <CreditCard size={20} />
          </div>

          <div>
            <span>UPI Collected</span>
            <strong>
              {formatCurrency(upiCollected)}
            </strong>
          </div>

        </div>

      </div>

      {/* =====================================
          SEARCH + FILTER
      ===================================== */}

      <div className="payments-filter-card">

        <div className="payments-search-box">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search payment, loan, customer, reference..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() =>
                setSearchTerm("")
              }
            >
              <X size={15} />
            </button>
          )}

        </div>

        <div className="payments-method-filter">

          <Filter size={16} />

          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(
                event.target.value
              )
            }
          >
            <option value="All">
              All Methods
            </option>

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

      {/* =====================================
          RESULTS INFO
      ===================================== */}

      <div className="payments-results-info">

        <span>
          Showing{" "}
          <strong>
            {filteredPayments.length}
          </strong>{" "}
          of{" "}
          <strong>{totalPayments}</strong>{" "}
          payments
        </span>

        {(searchTerm ||
          methodFilter !== "All") && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setMethodFilter("All");
            }}
          >
            Clear Filters
          </button>
        )}

      </div>

      {/* =====================================
          PAYMENT TABLE
      ===================================== */}

      <div className="payments-table-card">

        <div className="payments-table-header">

          <div>
            <h2>Payment Records</h2>

            <p>
              Complete history of recorded
              payments
            </p>
          </div>

          <div className="payments-record-count">
            {filteredPayments.length} Records
          </div>

        </div>

        {filteredPayments.length === 0 ? (
          <div className="payments-empty">

            <Receipt size={38} />

            <h3>No payments found</h3>

            <p>
              Try changing your search or
              payment method filter.
            </p>

          </div>
        ) : (
          <div className="payments-table-wrapper">

            <table className="payments-table">

              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Loan</th>
                  <th>Customer</th>
                  <th>Installment</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                </tr>
              </thead>

              <tbody>

                {filteredPayments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                      className="payment-row-clickable"
                      onClick={() =>
                        handleViewPayment(payment)
                      }
                    >

                      <td>
                        <div className="payment-id-cell">

                          <div className="payment-id-icon">
                            <Receipt size={15} />
                          </div>

                          <strong>
                            #{payment.id}
                          </strong>

                        </div>
                      </td>

                      <td>
                        <span className="loan-number-badge">
                          Loan #{payment.loan_id}
                        </span>
                      </td>

                      <td>
                        <div className="payment-customer-cell">

                          <div className="customer-small-icon">
                            <User size={14} />
                          </div>

                          <span>
                            {getCustomerName(
                              payment.loan_id
                            )}
                          </span>

                        </div>
                      </td>

                      <td>
                        {payment.installment_id
                          ? `#${payment.installment_id}`
                          : "-"}
                      </td>

                      <td>
                        <strong className="payment-amount">
                          {formatCurrency(
                            payment.amount
                          )}
                        </strong>
                      </td>

                      <td>
                        <div className="payment-date-cell">

                          <CalendarDays size={14} />

                          <span>
                            {formatDate(
                              payment.payment_date
                            )}
                          </span>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`payment-method-badge method-${String(
                            payment.payment_method
                          )
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              "-"
                            )}`}
                        >
                          <CreditCard size={13} />

                          {
                            payment.payment_method
                          }
                        </span>
                      </td>

                      <td>
                        <span className="payment-reference">
                          {payment.reference_number ||
                            "-"}
                        </span>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* =====================================
          ADD PAYMENT MODAL
      ===================================== */}

      {showForm && (
        <div
          className="payment-modal-overlay"
          onClick={handleCloseForm}
        >

          <div
            className="payment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="payment-modal-header">

              <div className="payment-modal-title">

                <div className="payment-modal-icon">
                  <IndianRupee size={21} />
                </div>

                <div>
                  <h2>Add Payment</h2>

                  <p>
                    Record a customer loan
                    payment
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="payment-modal-close"
                onClick={handleCloseForm}
                disabled={formLoading}
              >
                <X size={20} />
              </button>

            </div>

            {formError && (
              <div className="payment-form-error">

                <AlertCircle size={17} />

                <span>{formError}</span>

              </div>
            )}

            <form
              className="payment-form"
              onSubmit={handleSubmit}
            >

              <div className="payment-form-grid">

                {/* LOAN */}

                <div className="payment-form-group">

                  <label htmlFor="payment-loan">
                    Loan
                  </label>

                  <select
                    id="payment-loan"
                    name="loan_id"
                    value={formData.loan_id}
                    onChange={handleLoanChange}
                    required
                    disabled={formLoading}
                  >
                    <option value="">
                      Select Loan
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

                {/* INSTALLMENT */}

                <div className="payment-form-group">

                  <label htmlFor="payment-installment">
                    Installment
                  </label>

                  <select
                    id="payment-installment"
                    name="installment_id"
                    value={
                      formData.installment_id
                    }
                    onChange={
                      handleInstallmentChange
                    }
                    required
                    disabled={
                      formLoading ||
                      !formData.loan_id ||
                      installmentsLoading
                    }
                  >
                    <option value="">
                      {installmentsLoading
                        ? "Loading installments..."
                        : "Select Installment"}
                    </option>

                    {installments.map(
                      (installment) => {
                        const remaining =
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
                          <option
                            key={installment.id}
                            value={installment.id}
                            disabled={
                              remaining <= 0
                            }
                          >
                            Installment #
                            {
                              installment.installment_number
                            }{" "}
                            — Remaining{" "}
                            {formatCurrency(
                              remaining
                            )}
                            {remaining <= 0
                              ? " — Paid"
                              : ""}
                          </option>
                        );
                      }
                    )}

                  </select>

                </div>

                {/* AMOUNT */}

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
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="Enter amount"
                      required
                      disabled={formLoading}
                    />

                  </div>

                </div>

                {/* DATE */}

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
                        formData.payment_date
                      }
                      onChange={handleChange}
                      required
                      disabled={formLoading}
                    />

                  </div>

                </div>

                {/* METHOD */}

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
                        formData.payment_method
                      }
                      onChange={handleChange}
                      required
                      disabled={formLoading}
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
                      formData.reference_number
                    }
                    onChange={handleChange}
                    placeholder="e.g. UPI transaction ID"
                    disabled={formLoading}
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
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add payment notes..."
                    disabled={formLoading}
                  />

                </div>

              </div>

              {/* FOOTER */}

              <div className="payment-form-footer">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCloseForm}
                  disabled={formLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-payment-button"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loader2
                        size={16}
                        className="loading-spinner"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Receipt size={16} />
                      Record Payment
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================
          PAYMENT DETAILS MODAL
      ===================================== */}

      {selectedPayment && (
        <div
          className="payment-details-overlay"
          onClick={handleClosePaymentDetails}
        >

          <div
            className="payment-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="payment-details-header">

              <div className="payment-details-title">

                <div className="payment-details-icon">
                  <Receipt size={21} />
                </div>

                <div>
                  <h2>
                    Payment #{selectedPayment.id}
                  </h2>

                  <p>
                    Complete payment information
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="payment-details-close"
                onClick={
                  handleClosePaymentDetails
                }
              >
                <X size={20} />
              </button>

            </div>

            {/* PAYMENT AMOUNT */}

            <div className="payment-details-amount-card">

              <span>Payment Amount</span>

              <strong>
                {formatCurrency(
                  selectedPayment.amount
                )}
              </strong>

            </div>

            {/* DETAILS */}

            <div className="payment-details-grid">

              {/* PAYMENT INFORMATION */}

              <div className="payment-details-section-title">
                Payment Information
              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Payment ID
                </span>

                <strong>
                  #{selectedPayment.id}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Customer
                </span>

                <strong>
                  {getCustomerName(
                    selectedPayment.loan_id
                  )}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Loan
                </span>

                <strong>
                  Loan #{selectedPayment.loan_id}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Payment Date
                </span>

                <strong>
                  {formatDate(
                    selectedPayment.payment_date
                  )}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Payment Method
                </span>

                <strong>
                  {selectedPayment.payment_method}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Reference Number
                </span>

                <strong>
                  {selectedPayment.reference_number ||
                    "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Recorded On
                </span>

                <strong>
                  {selectedPayment.created_at
                    ? new Date(
                        selectedPayment.created_at
                      ).toLocaleString("en-IN")
                    : "-"}
                </strong>

              </div>

              {/* LOAN INFORMATION */}

              <div className="payment-details-section-title">
                Loan Information
              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Principal Amount
                </span>

                <strong>
                  {loanForPayment
                    ? formatCurrency(
                        loanForPayment.principal_amount
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Interest Rate
                </span>

                <strong>
                  {loanForPayment
                    ? `${loanForPayment.interest_rate}%`
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Interest Type
                </span>

                <strong>
                  {loanForPayment?.interest_type ||
                    "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Tenure
                </span>

                <strong>
                  {loanForPayment
                    ? `${loanForPayment.tenure_months} months`
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Loan Start Date
                </span>

                <strong>
                  {loanForPayment
                    ? formatDate(
                        loanForPayment.start_date
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Maturity Date
                </span>

                <strong>
                  {loanForPayment
                    ? formatDate(
                        loanForPayment.maturity_date
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Loan Status
                </span>

                <strong>
                  {loanForPayment?.status || "-"}
                </strong>

              </div>

              {/* INSTALLMENT INFORMATION */}

              <div className="payment-details-section-title">
                Installment Information
              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Installment Number
                </span>

                <strong>
                  {installmentForPayment
                    ? `#${installmentForPayment.installment_number}`
                    : selectedPayment.installment_id
                      ? `#${selectedPayment.installment_id}`
                      : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Due Date
                </span>

                <strong>
                  {installmentForPayment
                    ? formatDate(
                        installmentForPayment.due_date
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Principal
                </span>

                <strong>
                  {installmentForPayment
                    ? formatCurrency(
                        installmentForPayment.principal_amount
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Interest
                </span>

                <strong>
                  {installmentForPayment
                    ? formatCurrency(
                        installmentForPayment.interest_amount
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Total Installment
                </span>

                <strong>
                  {installmentForPayment
                    ? formatCurrency(
                        installmentForPayment.total_amount
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Paid Amount
                </span>

                <strong>
                  {installmentForPayment
                    ? formatCurrency(
                        installmentForPayment.paid_amount
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Remaining Amount
                </span>

                <strong>
                  {installmentForPayment
                    ? formatCurrency(
                        getRemainingInstallmentAmount(
                          installmentForPayment
                        )
                      )
                    : "-"}
                </strong>

              </div>

              <div className="payment-detail-item">

                <span className="payment-detail-label">
                  Installment Status
                </span>

                <strong>
                  {installmentForPayment?.status ||
                    "-"}
                </strong>

              </div>

            </div>

            {/* NOTES */}

            <div className="payment-details-notes">

              <span className="payment-detail-label">
                Notes
              </span>

              <p>
                {selectedPayment.notes ||
                  "No notes added for this payment."}
              </p>

            </div>

            {/* FOOTER */}

            <div className="payment-details-footer">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleClosePaymentDetails
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Payments;
