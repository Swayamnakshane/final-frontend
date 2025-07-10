

import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const CameraPermissionModal = ({ show, onRetry }) => (
  <div
    className={`modal fade ${show ? "show d-block" : "d-none"}`}
    tabIndex="-1"
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
  >
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content border-0 shadow-lg rounded-4">
        <div className="modal-header bg-gradient text-white rounded-top-4" style={{ background: "linear-gradient(45deg, #dc3545, #ff6b6b)" }}>
          <h5 className="modal-title">
            <i className="bi bi-camera-video-off me-2" /> Camera Access Required
          </h5>
        </div>
        <div className="modal-body text-center">
          <p className="fs-6 text-muted mb-3">
            To ensure exam integrity, webcam access is mandatory. Please allow access to continue.
          </p>
          <i className="bi bi-webcam fs-1 text-danger mb-3" />
        </div>
        <div className="modal-footer border-0 justify-content-center pb-4">
          <button className="btn btn-lg btn-danger px-4 py-2 rounded-pill" onClick={onRetry}>
            <i className="bi bi-arrow-repeat me-2" /> Grant Camera Access
          </button>
        </div>
      </div>
    </div>
  </div>
);

const SessionWarningModal = ({ show, onHide, count }) => (
  <div className={`modal fade ${show ? "show d-block" : "d-none"}`} tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog">
      <div className="modal-content border-0 shadow-lg">
        <div className="modal-header bg-warning text-dark">
          <h5 className="modal-title"><i className="bi bi-exclamation-triangle me-2" /> Warning</h5>
          <button type="button" className="btn-close" onClick={onHide}></button>
        </div>
        <div className="modal-body">
          <p className="fw-medium">
            You have switched tabs <span className="badge bg-danger mx-2">{count}</span> times. 
          </p>
          <div className="alert alert-danger py-1">
            More than 4 switches will auto-submit your exam!
          </div>
        </div>
        <div className="modal-footer border-0">
          <button type="button" className="btn btn-dark rounded-pill px-4" onClick={onHide}>
            Continue Exam
          </button>
        </div>
      </div>
    </div>
  </div>
);

const statusColors = {
  answered: "success",
  notAnswered: "danger",
  review: "warning",
  notVisited: "secondary",
};

const ExamPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({});
  const [candidate, setCandidate] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [unansweredQuestions, setUnansweredQuestions] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    answered: 0,
    notAnswered: 0,
    review: 0,
    notVisited: 0
  });

  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const visibilityTimeout = useRef(null);
  const endsAtRef = useRef(null);
  const webcamStreamRef = useRef(null);

  const currentQuestion = questions[currentQuestionIndex];

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const seconds = (timeLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const toggleMarkForReview = () => {
    if (!currentQuestion) return;
    const qid = currentQuestion.question_id;
    const updated = { ...markedForReview, [qid]: !markedForReview[qid] };
    setMarkedForReview(updated);
  };

  const prepareSubmit = () => {
    const unanswered = questions
      .filter(q => answers[q.question_id] === undefined)
      .map((q, idx) => idx + 1);
    setUnansweredQuestions(unanswered);
    setShowSubmitModal(true);
  };

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }

    try {
      await api.post("/candidate/submit/exam");
      localStorage.removeItem("answers");
      localStorage.removeItem("exam_ends_at");
      navigate("/exam/response");
    } catch {
      navigate("/error", { state: { message: "Submission failed" } });
    }
  }, [navigate]);

  // Calculate question status counts
  useEffect(() => {
    if (questions.length === 0) return;
    
    let counts = {
      answered: 0,
      notAnswered: 0,
      review: 0,
      notVisited: 0
    };
    
    questions.forEach(q => {
      const qid = q.question_id;
      if (answers[qid] !== undefined) {
        counts[markedForReview[qid] ? 'review' : 'answered']++;
      } else if (markedForReview[qid]) {
        counts.review++;
      } else if (visited[qid]) {
        counts.notAnswered++;
      } else {
        counts.notVisited++;
      }
    });
    
    setStatusCounts(counts);
  }, [questions, answers, markedForReview, visited]);

  useEffect(() => {
    if (!examStarted || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [examStarted, timeLeft, handleSubmit]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileRes, questionsRes] = await Promise.all([
          api.get("/candidate/profile"),
          api.get("/candidate/get/questions"),
        ]);

        setCandidate(profileRes.data.candidate_name);
        setQuestions(questionsRes.data.mcqs || []);

        const savedAnswers = JSON.parse(localStorage.getItem("answers") || "{}");
        const serverAnswers = await api.get("/candidate/get/all/answers");
        setAnswers({ ...serverAnswers.data.answers, ...savedAnswers });

        const storedEndsAt = localStorage.getItem("exam_ends_at");
        endsAtRef.current = storedEndsAt;

        if (!storedEndsAt) {
          const { data } = await api.post("/candidate/start_exam");
          endsAtRef.current = data.ends_at;
          localStorage.setItem("exam_ends_at", data.ends_at);
          setExamStarted(true);
          setTimeLeft(Math.floor((new Date(data.ends_at) - new Date()) / 1000));
        } else {
          setTimeLeft(Math.floor((new Date(storedEndsAt) - new Date()) / 1000));
          setExamStarted(true);
        }
      } catch {
        navigate("/error", { state: { message: "Initialization failed" } });
      }
    };

    loadData();
  }, [navigate]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setSessionWarning(true);
        try {
          const { data } = await api.post("/candidate/log_tab_switch");
          setTabSwitchCount(data.tab_switch_count);
          if (data.auto_submitted) return handleSubmit();
          setWarningMessage(data.message);
          visibilityTimeout.current = setTimeout(() => setWarningMessage(""), 5000);
        } catch (error) {
          if (error.response?.status === 403) {
            alert("Disqualified: " + error.response.data.message);
            handleSubmit();
          }
        }
      }
    };

    const blockShortcuts = (e) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && ["r"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", blockShortcuts);
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", blockShortcuts);
      document.removeEventListener("contextmenu", (e) => e.preventDefault());
      clearTimeout(visibilityTimeout.current);
    };
  }, [handleSubmit]);

  const streamWebcam = useCallback(async () => {
    try {
      // Stop existing stream if any
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
        webcamStreamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraPermission(true);
    } catch (err) {
      setCameraPermission(false);
      webcamStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    streamWebcam();
    
    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
        webcamStreamRef.current = null;
      }
    };
  }, [streamWebcam]);

  const handleAnswer = (question_id, option) => {
    if (!cameraPermission) return;
    const updatedAnswers = { ...answers, [question_id]: option };
    setAnswers(updatedAnswers);
    localStorage.setItem("answers", JSON.stringify(updatedAnswers));
    api.post("/candidate/answer", { question_id, answer: option }).catch(() => {});
  };

  // Track visited questions
  useEffect(() => {
    if (currentQuestion) {
      setVisited(prev => ({ ...prev, [currentQuestion.question_id]: true }));
    }
  }, [currentQuestion]);

  const getQuestionStatus = (qid) => {
    if (answers[qid] !== undefined) {
      return markedForReview[qid] ? 'review' : 'answered';
    } else if (markedForReview[qid]) {
      return 'review';
    } else if (visited[qid]) {
      return 'notAnswered';
    } else {
      return 'notVisited';
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column bg-light">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm border-bottom">
        <div className="d-flex align-items-center">
          <i className="bi bi-patch-check-fill text-primary fs-3 me-2"></i>
          <h4 className="mb-0 fw-bold text-primary">Arcap Exam</h4>
        </div>
        <div className="text-end">
          <div className="d-flex align-items-center justify-content-end">
            <i className="bi bi-clock-history text-danger fs-4 me-2"></i>
            <div className="fs-4 fw-bold text-danger">{formatTime()}</div>
          </div>
          <small className="text-muted d-block">Candidate: {candidate}</small>
        </div>
      </div>

      {warningMessage && (
        <div className="alert alert-danger m-3 d-flex align-items-center">
          <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
          <span>{warningMessage}</span>
        </div>
      )}

      <div className="row flex-grow-1 m-0">
        {/* Questions Panel */}
        <div className="col-lg-8 p-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <span className="fw-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              {markedForReview[currentQuestion?.question_id] && (
                <span className="badge bg-warning">
                  <i className="bi bi-bookmark me-1"></i> Marked for Review
                </span>
              )}
            </div>
            <div className="card-body overflow-auto">
              <h5 className="card-title mb-4 fw-normal">{currentQuestion?.question}</h5>
              <div className="vstack gap-3">
                {currentQuestion?.options?.map((opt, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-3 border cursor-pointer ${
                      answers[currentQuestion?.question_id] === opt[0]
                        ? "bg-primary text-white border-primary"
                        : "bg-white"
                    }`}
                    onClick={() => 
                      cameraPermission && handleAnswer(currentQuestion.question_id, opt[0])
                    }
                  >
                    <div className="d-flex align-items-start">
                      <span className="fw-bold me-3">{opt[0]}.</span>
                      <span>{opt.slice(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-footer bg-light d-flex justify-content-between">
              <button
                className={`btn ${
                  markedForReview[currentQuestion?.question_id]
                    ? "btn-warning"
                    : "btn-outline-warning"
                }`}
                onClick={toggleMarkForReview}
                disabled={!cameraPermission}
              >
                <i className="bi bi-bookmark me-2" />
                {markedForReview[currentQuestion?.question_id]
                  ? "Unmark Review"
                  : "Mark for Review"}
              </button>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-danger"
                  onClick={() => {
                    const newAnswers = { ...answers };
                    delete newAnswers[currentQuestion?.question_id];
                    setAnswers(newAnswers);
                    localStorage.setItem("answers", JSON.stringify(newAnswers));
                  }}
                  disabled={!cameraPermission}
                >
                  Clear Response
                </button>
                <button
                  className="btn btn-outline-secondary"
                  disabled={currentQuestionIndex === 0}
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                  }
                >
                  <i className="bi bi-arrow-left me-1"></i> Previous
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(prev + 1, questions.length - 1)
                    )
                  }
                >
                  {currentQuestionIndex === questions.length - 1 
                    ? "Finish" 
                    : <><i className="bi bi-arrow-right me-1"></i> Next</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Palette + Camera Panel */}
        <div className="col-lg-4 p-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <span>Question Palette</span>
              <span className="badge bg-light text-dark fs-6">
                {questions.length} Questions
              </span>
            </div>
            <div className="card-body d-flex flex-column">
              {/* Status Summary Bar */}
              <div className="d-flex justify-content-between mb-3 p-2 bg-white rounded-3 border">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="d-flex flex-column align-items-center">
                    <div className="d-flex align-items-center mb-1">
                      <span className={`badge bg-${statusColors[status]} me-1`} style={{ width: 12, height: 12, borderRadius: '50%' }}></span>
                      <span className="fw-bold small">{count}</span>
                    </div>
                    <small className="text-capitalize text-muted" style={{ fontSize: "0.65rem" }}>
                      {status.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </small>
                  </div>
                ))}
              </div>
              
              {/* Question Grid */}
              <div className="d-grid gap-2 mb-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q.question_id);
                  return (
                    <button
                      key={q.question_id}
                      className={`btn btn-sm btn-${statusColors[status]} position-relative`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                    >
                      {idx + 1}
                      {status === 'review' && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning">
                          <i className="bi bi-bookmark"></i>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Camera Section */}
              <div className="mt-auto">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="fw-medium">Live Proctoring</div>
                  <div className={`badge ${cameraPermission ? "bg-success" : "bg-danger"}`}>
                    {cameraPermission ? "Active" : "Disabled"}
                  </div>
                </div>
                <div className="d-flex justify-content-center mb-3">
                  <div className="rounded-circle overflow-hidden border border-2 border-primary" style={{ width: 120, height: 120 }}>
                    <video
                      ref={videoRef}
                      width="120"
                      height="120"
                      muted
                      autoPlay
                      playsInline
                      style={{ objectFit: "cover", transform: "scaleX(-1)" }}
                    />
                  </div>
                </div>
                
                <button 
                  className="btn btn-danger w-100 rounded-pill py-2 fw-medium"
                  onClick={prepareSubmit}
                >
                  <i className="bi bi-check-circle me-2"></i> Submit Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2" /> Confirm Submission
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSubmitModal(false)}></button>
              </div>
              <div className="modal-body">
                {unansweredQuestions.length > 0 && (
                  <div className="alert alert-warning d-flex align-items-center">
                    <i className="bi bi-exclamation-circle me-2 fs-5"></i>
                    <div>
                      <span className="d-block fw-medium mb-1">Unanswered Questions:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {unansweredQuestions.map(num => (
                          <span key={num} className="badge bg-dark me-1">{num}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <p className="mb-0">Are you sure you want to submit your exam?</p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger rounded-pill px-4" onClick={handleSubmit}>
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Permission Modal */}
      <CameraPermissionModal show={!cameraPermission} onRetry={streamWebcam} />
      
      {/* Tab Switch Warning Modal */}
      <SessionWarningModal 
        show={sessionWarning} 
        onHide={() => setSessionWarning(false)} 
        count={tabSwitchCount} 
      />
    </div>
  );
};

export default ExamPage;