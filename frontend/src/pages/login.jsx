
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  User,
  LockKeyhole,
  LogIn,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const formData = new URLSearchParams();

      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

      login(response.data.access_token);
      navigate("/dashboard");
    } catch (error) {
      if (error.response) {
        setMessage(
          error.response.data.detail ||
            "Login failed"
        );
      } else {
        setMessage(
          "Cannot connect to the backend"
        );
      }
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        {/* Logo */}

        <div className="login-logo">
          <Wallet size={28} />
        </div>

        {/* Header */}

        <h1>FinancePro</h1>

        <p className="login-subtitle">
          Finance & Loan Management System
        </p>

        {/* Login Form */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* Username */}

          <div className="login-form-group">

            <label htmlFor="username">
              Username
            </label>

            <div className="login-input-wrapper">

              <User
                size={18}
                className="login-input-icon"
              />

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter your username"
                required
              />

            </div>

          </div>

          {/* Password */}

          <div className="login-form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="login-input-wrapper">

              <LockKeyhole
                size={18}
                className="login-input-icon"
              />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />

            </div>

          </div>

          {/* Error */}

          {message && (
            <div className="login-error">
              {message}
            </div>
          )}

          {/* Login Button */}

          <button
            type="submit"
            className="login-button"
          >
            <LogIn size={17} />
            Login
          </button>

        </form>

        {/* Footer */}

        <div className="login-footer">
          Secure access to your finance management
          dashboard
        </div>

      </div>

    </div>
  );
}

export default Login;

