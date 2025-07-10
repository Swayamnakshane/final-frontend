// ExamInstructions.jsx
import React, { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const AWS_BANNER_URL =
  "https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230";

const ExamInstructions = () => {
  const videoRef = useRef(null);
  const [profile, setProfile] = useState({});
  const [webcamStarted, setWebcamStarted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWebcamAlert, setShowWebcamAlert] = useState(false);
  const navigate = useNavigate();

  const sessionId = "EXM" + Math.floor(100000 + Math.random() * 900000);

  const checkWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
      setWebcamStarted(true);
      setErrorMsg("");
      setShowWebcamAlert(false);
    } catch {
      setWebcamStarted(false);
      setErrorMsg("❌ Webcam access is required to begin the examination.");
      setShowWebcamAlert(true);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/candidate/profile");
        const { exam_duration } = res.data;
        const mins = exam_duration || 0;
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        res.data.formattedDuration = `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;
        setProfile(res.data);
      } catch {
        navigate("/");
      }
    };

    fetchProfile();
    checkWebcam();

    const interval = setInterval(() => {
      if (!videoRef.current?.srcObject?.active) {
        setWebcamStarted(false);
        setShowWebcamAlert(true);
        checkWebcam();
      }
    }, 10000); // check every 10s

    return () => {
      const currentStream = videoRef.current?.srcObject;
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      clearInterval(interval);
    };
  }, [navigate]);

  const handleStartClick = () => {
    if (!webcamStarted) {
      setErrorMsg("❌ Please allow webcam access to continue.");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmStartExam = async () => {
    setShowConfirmModal(false);
    try {
      const res = await api.post("/candidate/start_exam");
      const msg = res.data.message;
      if (msg === "Exam started successfully." || msg === "Exam already started.") {
        navigate("/exam");
      } else {
        alert(msg);
      }
    } catch {
      alert("Session expired or error starting exam.");
      navigate("/");
    }
  };

  return (
    <div className="container py-5 bg-light min-vh-100">
      <div className="card mx-auto shadow-lg" style={{ maxWidth: "850px" }}>
        <img
          src={AWS_BANNER_URL}
          className="card-img-top"
          alt="Exam Banner"
          style={{ height: "235px", objectFit: "cover" }}
        />

        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              <i className="bi bi-journal-code me-2"></i>
              {profile.batch_title || "Assessment Portal"}
            </h5>
            <small>Candidate: <strong>{profile.candidate_name}</strong></small><br />
            <small>Exam Dates: <strong>{profile.exam_start_date} – {profile.exam_end_date}</strong></small>
          </div>
          <div className="text-end">
            <small>Session ID: <strong>{sessionId}</strong></small><br />
            <small>Duration: <strong>{profile.formattedDuration}</strong></small>
          </div>
        </div>

        <div className="card-body">
          <h4 className="text-warning mb-4">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> Examination Instructions
          </h4>
          <div className="alert alert-danger">
            <h6><i className="bi bi-shield-lock-fill me-2"></i> 🔒 Strict Examination Rules</h6>
            <ul className="mb-0">
              <li>🖥 Stay on the test tab throughout – tab switching is monitored and flagged.</li>
              <li>📚 Do not use external resources such as notes, books, or websites.</li>
              <li>❌ No screenshots or screen recordings are allowed.</li>
              <li>📞 Avoid any communication (calls, messages, or chats) during the exam.</li>
              <li>🎥 Webcam monitoring is <strong>mandatory</strong> throughout the session.</li>
              <li>🔁 Only one attempt is allowed. Please make sure you're ready before starting.</li>
            </ul>
          </div>

          <div className="mt-4">
            <video
              ref={videoRef}
              width="100%"
              height="240"
              className="rounded border"
              muted
              autoPlay
              playsInline
            ></video>
            {errorMsg && <div className="text-danger mt-2 fw-bold">{errorMsg}</div>}
            {showWebcamAlert && (
              <div className="alert alert-warning mt-3">
                <i className="bi bi-camera-video-off me-2"></i>
                Webcam appears to be turned off. Please keep it on during the exam.
              </div>
            )}
          </div>
        </div>

        <div className="card-footer d-flex justify-content-between">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>
            <i className="bi bi-arrow-left"></i> Back to Login
          </button>
          <button
            className="btn btn-success"
            onClick={handleStartClick}
            disabled={!webcamStarted}
          >
            <i className="bi bi-play-fill"></i> Start Examination
          </button>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">
                  <i className="bi bi-exclamation-circle me-2"></i> Confirm Start
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Once you start the examination, you cannot pause or restart. Are you sure you want to begin?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={confirmStartExam}>
                  Yes, Start Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInstructions;