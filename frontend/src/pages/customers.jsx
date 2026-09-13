import { useEffect, useState } from "react";
import { Search, Plus, User, Pencil, Trash2, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Customers() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    occupation: "",
  });

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editingCustomerId, setEditingCustomerId] = useState(null);

  // =========================================================
  // FETCH CUSTOMERS
  // =========================================================

  const fetchCustomers = async () => {
    try {
      const response = await api.get("/customers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomers(response.data);
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredCustomers = customers.filter((customer) => {
    const search = searchTerm.toLowerCase();

    return (
      customer.full_name?.toLowerCase().includes(search) ||
      customer.phone?.toLowerCase().includes(search) ||
      customer.email?.toLowerCase().includes(search)
    );
  });

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // ADD CUSTOMER
  // =========================================================

  const handleAddCustomer = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");

      await api.post("/customers", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setFormData({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        occupation: "",
      });

      setShowForm(false);

      await fetchCustomers();
    } catch (error) {
      console.error("Add customer error:", error);

      if (error.response) {
        setFormError(
          error.response.data.detail ||
            "Failed to add customer"
        );
      } else {
        setFormError("Cannot connect to the backend");
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT CUSTOMER - OPEN FORM
  // =========================================================

  const handleEditCustomer = (customer) => {
    setEditingCustomerId(customer.id);

    setFormData({
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      occupation: customer.occupation || "",
    });

    setFormError("");
    setShowForm(true);
  };

  // =========================================================
  // UPDATE CUSTOMER
  // =========================================================

  const handleUpdateCustomer = async (event) => {
    event.preventDefault();

    if (!editingCustomerId) {
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await api.put(
        `/customers/${editingCustomerId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setFormData({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        occupation: "",
      });

      setEditingCustomerId(null);
      setShowForm(false);

      await fetchCustomers();
    } catch (error) {
      console.error("Update customer error:", error);

      if (error.response) {
        setFormError(
          error.response.data.detail ||
            "Failed to update customer"
        );
      } else {
        setFormError("Cannot connect to the backend");
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CANCEL FORM
  // =========================================================

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCustomerId(null);

    setFormData({
      full_name: "",
      phone: "",
      email: "",
      address: "",
      occupation: "",
    });

    setFormError("");
  };

  // =========================================================
  // DELETE CUSTOMER
  // =========================================================

  const handleDeleteCustomer = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.full_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/customers/${customer.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchCustomers();
    } catch (error) {
      console.error("Delete customer error:", error);

      if (error.response) {
        alert(
          error.response.data.detail ||
            "Failed to delete customer"
        );
      } else {
        alert("Cannot connect to the backend");
      }
    }
  };

  // =========================================================
  // VIEW CUSTOMER DETAILS
  // =========================================================

  const handleViewCustomer = (customer) => {
    navigate(`/customers/${customer.id}`);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="customers-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>
            Manage your customers and their information
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setEditingCustomerId(null);
              setFormError("");

              setFormData({
                full_name: "",
                phone: "",
                email: "",
                address: "",
                occupation: "",
              });

              setShowForm(true);
            }}
          >
            <Plus size={18} />
            Add Customer
          </button>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT CUSTOMER FORM
      ===================================================== */}

      {showForm && (
        <div className="customer-form-card">

          <div className="customer-form-header">
            <div>
              <h2>
                {editingCustomerId
                  ? "Edit Customer"
                  : "Add New Customer"}
              </h2>

              <p>
                {editingCustomerId
                  ? "Update customer information"
                  : "Enter customer details below"}
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

          <form
            onSubmit={
              editingCustomerId
                ? handleUpdateCustomer
                : handleAddCustomer
            }
          >

            <div className="customer-form-grid">

              <div className="form-group">
                <label>Full Name *</label>

                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone *</label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label>Occupation</label>

                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  placeholder="Enter occupation"
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter customer address"
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
                  ? editingCustomerId
                    ? "Updating..."
                    : "Saving..."
                  : editingCustomerId
                  ? "Update Customer"
                  : "Save Customer"}
              </button>

            </div>

          </form>
        </div>
      )}

      {/* =====================================================
          CUSTOMER LIST
      ===================================================== */}

      {!showForm && (
        <>
          <div className="customer-toolbar">

            <div className="search-box">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
              />
            </div>

            <div className="customer-count">
              {filteredCustomers.length} customers
            </div>

          </div>

          {filteredCustomers.length > 0 ? (
            <div className="customers-grid">

              {filteredCustomers.map((customer) => (
                <div
                  className="customer-card"
                  key={customer.id}
                >

                  <div className="customer-card-header">

                    <div className="customer-avatar">
                      {customer.full_name
                        ?.charAt(0)
                        .toUpperCase() || (
                        <User size={20} />
                      )}
                    </div>

                    <div className="customer-details">

                      <h3>{customer.full_name}</h3>

                      <p>{customer.phone}</p>

                      {customer.email && (
                        <p>{customer.email}</p>
                      )}

                    </div>

                  </div>

                  <div className="customer-info">

                    {customer.occupation && (
                      <div>
                        <span>Occupation</span>
                        <strong>
                          {customer.occupation}
                        </strong>
                      </div>
                    )}

                    {customer.address && (
                      <div>
                        <span>Address</span>
                        <strong>
                          {customer.address}
                        </strong>
                      </div>
                    )}

                  </div>

                  {/* =================================================
                      ACTION BUTTONS
                  ================================================= */}

                  <div className="customer-actions">

                    <button
                      type="button"
                      className="view-button"
                      onClick={() =>
                        handleViewCustomer(customer)
                      }
                    >
                      <Eye size={14} />
                      View
                    </button>

                    <button
                      type="button"
                      className="edit-button"
                      onClick={() =>
                        handleEditCustomer(customer)
                      }
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDeleteCustomer(customer)
                      }
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          ) : (
            <div className="customers-empty">

              <User size={32} />

              <h3>No customers found</h3>

              <p>
                Try a different search or add a new
                customer.
              </p>

            </div>
          )}
        </>
      )}

    </div>
  );
}

export default Customers;

