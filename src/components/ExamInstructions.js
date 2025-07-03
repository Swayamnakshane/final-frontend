import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const ExamInstructions = () => {
  const [profile, setProfile] = useState({});
  const [webcamStarted, setWebcamStarted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();

  const sessionId = "EXM" + Math.floor(100000 + Math.random() * 900000);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    axios.post("http://127.0.0.1:5000/candidate/log_tab_switch", {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      console.log("Tab switch count:", res.data.tab_switch_count);
    }).catch(err => {
      console.error("Failed to log tab switch:", err);
    });

    axios.get("http://127.0.0.1:5000/candidate/profile", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const { exam_duration } = res.data;
      const mins = exam_duration;
      const h = Math.floor(mins / 60), m = mins % 60;
      res.data.formattedDuration = `${h > 0 ? h + 'h ' : ''}${m}m`;
      setProfile(res.data);
    }).catch(() => navigate("/"));
  }, [navigate]);

  useEffect(() => {
    const handleTabChange = () => {
      if (document.hidden) {
        alert("Tab switching is not allowed. You will be disqualified.");
        window.close(); // Or redirect to disqualification page
      }
    };
    document.addEventListener("visibilitychange", handleTabChange);
    return () => {
      document.removeEventListener("visibilitychange", handleTabChange);
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.getElementById("webcam-preview");
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }
      setWebcamStarted(true);
    } catch (err) {
      alert("Webcam access is required to start the exam.");
    }
  };

  const handleStartClick = async () => {
    if (!webcamStarted) {
      await startWebcam();
    }
    setShowConfirmModal(true);
  };

  const confirmStartExam = async () => {
    const token = localStorage.getItem("token");
    setShowConfirmModal(false);

    try {
      const res = await axios.post("http://127.0.0.1:5000/candidate/start_exam", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.message === "Exam already started." || res.data.message === "Exam started successfully.") {
        navigate("/exam");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Session expired or error starting exam.");
      navigate("/");
    }
  };

  return (
    <div className="container py-5 bg-light min-vh-100">
      <div className="card mx-auto shadow-lg" style={{ maxWidth: "800px" }}>
        <img
          src="/assets/exam-banner.jpg"
          className="card-img-top"
          alt="Exam Banner"
          style={{ height: "200px", objectFit: "cover" }}
        />
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">
              <i className="bi bi-journal-code me-2"></i>
              {profile.batch_title || 'Assessment Portal'}
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
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Examination Instructions
          </h4>

          <div className="alert alert-danger mt-4">
            <h6><i className="bi bi-shield-lock-fill me-2"></i>Strict Examination Rules</h6>
            <ul>
              <li>No tab switching – monitored</li>
              <li>No external resources</li>
              <li>No screenshot/recording</li>
              <li>No communication (calls/chat)</li>
              <li>Webcam monitoring <strong>(Required)</strong></li>
              <li>Single attempt only</li>
            </ul>
          </div>

          <div className="mt-4">
            <video id="webcam-preview" width="100%" height="240" className="rounded border" muted></video>
            {!webcamStarted && (
              <div className="text-danger mt-2">
                Webcam access required to proceed.
              </div>
            )}
          </div>
        </div>

        <div className="card-footer d-flex justify-content-between">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/")}>
            <i className="bi bi-arrow-left"></i> Back to Login
          </button>
          <button className="btn btn-success" onClick={handleStartClick}>
            <i className="bi bi-play-fill"></i> {webcamStarted ? 'Start Examination' : 'Enable Webcam & Start'}
          </button>
        </div>
      </div>

      {/* ✅ Confirm Start Modal */}
      {showConfirmModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger"><i className="bi bi-exclamation-circle me-2"></i>Confirm Start</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Once you start the examination, you cannot pause or restart. Are you sure you want to begin?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmStartExam}>Yes, Start Exam</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInstructions;
