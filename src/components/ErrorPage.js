import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light text-center">
      <h1 className="display-1 text-danger">404</h1>
      <p className="lead text-dark">Oops! Something went wrong or the page doesn't exist.</p>
      <button className="btn btn-primary mt-3" onClick={() => navigate("/")}>
        Go to Login Page
      </button>
    </div>
  );
};

export default ErrorPage;
