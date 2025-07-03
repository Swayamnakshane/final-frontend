// src/components/LoginPage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const LoginPage = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const res = await axios.post("http://127.0.0.1:5000/candidate/login", {
        user_id: userId,
        password: password,
      });

      const { access_token, is_submitted } = res.data;
      localStorage.setItem("token", access_token);

      // ✅ Navigate based on exam submission status
      if (is_submitted) {
        navigate("/exam/response");
      } else {
        navigate("/instructions");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-lg p-4 rounded" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="text-center mb-4">
          <div className="bg-primary text-white rounded-circle p-3 mx-auto mb-2" style={{ width: 60, height: 60 }}>
            <i className="bi bi-mortarboard-fill fs-3"></i>
          </div>
          <h4 className="fw-bold">MCQ Assessment Portal</h4>
          <p className="text-muted">Industry Level Technical Examination</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">User ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && <div className="alert alert-danger p-2 text-center">{errorMsg}</div>}

          <button type="submit" className="btn btn-primary w-100">
            <i className="bi bi-box-arrow-in-right me-2"></i> Login to Exam
          </button>
        </form>

        <div className="text-center text-muted mt-4">
          <small>
            <i className="bi bi-shield-lock"></i> Secure Examination Environment
          </small>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
