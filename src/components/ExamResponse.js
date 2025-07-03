import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const ExamResponse = () => {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="d-flex justify-content-center align-items-center bg-light vh-100"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <Confetti width={windowSize.width} height={windowSize.height} />
      <div className="text-center p-5 bg-white rounded shadow-lg" style={{ maxWidth: "600px" }}>
        <div
          style={{
            fontSize: "100px",
            color: "#28a745",
            animation: "zoomIn 0.6s ease-out",
          }}
          className="mb-4"
        >
          ✅
        </div>
        <h1 className="mb-3 fw-bold text-dark" style={{ fontSize: "2.5rem" }}>
          Thank You!
        </h1>
        <p className="lead mb-4 text-secondary">
          Your exam has been <strong>submitted successfully</strong>.
        </p>
        <button
          className="btn btn-outline-primary px-4 py-2"
          onClick={() => navigate("/")}
        >
          ⬅ Back to Home
        </button>
      </div>

      <style>{`
        @keyframes zoomIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ExamResponse;
