import React, { useEffect, useState, useCallback } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ExamPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("answers");
    return saved ? JSON.parse(saved) : {};
  });
  const [candidate, setCandidate] = useState("Candidate");
  const [showModal, setShowModal] = useState(false);
  const [unanswered, setUnanswered] = useState([]);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerInitialized, setTimerInitialized] = useState(false);

  const questionsPerPage = 2;
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const handleSubmit = useCallback(() => {
    api.post("/candidate/submit/exam")
      .then(() => {
        localStorage.removeItem("answers");
        localStorage.removeItem("exam_timer");
        navigate("/exam/response");
      })
      .catch(() => navigate("/error"));
  }, [navigate]);

  useEffect(() => {
    if (!timerInitialized) return;

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const updated = prev - 1;
        localStorage.setItem("exam_timer", updated);
        if (updated <= 0) clearInterval(interval);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, handleSubmit, timerInitialized]);

  useEffect(() => {
    api.get("/candidate/get/questions")
      .then(res => setQuestions(res.data.mcqs))
      .catch(() => navigate("/error"));

    api.get("/candidate/profile")
      .then(res => {
        setCandidate(res.data.candidate_name);
        const duration = (res.data.exam_duration || 60) * 60;
        const saved = localStorage.getItem("exam_timer");
        const parsed = saved ? parseInt(saved, 10) : null;
        const finalTime = !isNaN(parsed) && parsed > 0 ? parsed : duration;
        setTimeLeft(finalTime);
        setTimerInitialized(true);
      })
      .catch(() => navigate("/error"));
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("answers", JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your exam will be auto-submitted.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        api.post("/candidate/log_tab_switch")
          .then(res => {
            setTabSwitchCount(res.data.tab_switch_count);
            if (res.data.auto_submitted) {
              alert("Disqualified due to tab switching. Exam auto-submitted.");
              navigate("/exam/response");
            } else {
              setWarningMessage(res.data.message);
            }
          })
          .catch(error => {
            if (error.response?.status === 403) {
              const msg = error.response.data?.message || "You have been disqualified.";
              alert(msg);
              navigate("/exam/response");
            } else {
              navigate("/error");
            }
          });
      }
    };

    const blockContextMenu = e => e.preventDefault();
    const blockDevTools = e => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key))) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockDevTools);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockDevTools);
    };
  }, [navigate]);

  const handleAnswer = (qid, selectedOption) => {
    setAnswers(prev => ({ ...prev, [qid]: selectedOption }));
    api.post("/candidate/answer", { question_id: qid, answer: selectedOption })
      .catch(() => navigate("/error"));
  };

  const prepareSubmit = () => {
    const unansweredQs = questions.map((q, i) => (!answers[q.question_id] ? i + 1 : null)).filter(Boolean);
    setUnanswered(unansweredQs);
    setShowModal(true);
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const paginatedQuestions = questions.slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage);

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white shadow rounded">
        <h4 className="text-primary mb-0"><i className="bi bi-person-circle me-2"></i>{candidate}</h4>
        <h5 className="text-danger mb-0"><i className="bi bi-clock me-2"></i>{formatTime()}</h5>
      </div>

      <div className="alert alert-warning">
        ⚠️ Do not switch tabs! Tab switches: <strong>{tabSwitchCount}</strong> / 4
      </div>
      {warningMessage && <div className="alert alert-danger"><strong>{warningMessage}</strong></div>}

      <div className="row">
        <div className="col-md-2 mb-4">
          <div className="bg-white shadow rounded p-3">
            <h6 className="text-center mb-3 text-secondary">📘 Questions</h6>
            <div className="d-flex flex-wrap justify-content-center">
              {questions.map((q, i) => (
                <button
                  key={q.question_id}
                  className={`btn m-1 btn-sm ${answers[q.question_id] ? "btn-success" : "btn-outline-dark"}`}
                  onClick={() => setCurrentPage(Math.floor(i / questionsPerPage) + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-md-10">
          {paginatedQuestions.map((q, idx) => (
            <div key={q.question_id} className="card mb-4 border-0 shadow-sm">
              <div className="card-header bg-primary text-white fw-bold">
                Question {(currentPage - 1) * questionsPerPage + idx + 1}
              </div>
              <div className="card-body bg-white">
                <p className="fw-semibold text-dark">{q.question}</p>
                {q.options.map((opt, i) => (
                  <div className="form-check mb-2" key={i}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`q-${q.question_id}`}
                      id={`q-${q.question_id}-opt-${i}`}
                      checked={answers[q.question_id] === opt[0]}
                      onChange={() => handleAnswer(q.question_id, opt[0])}
                    />
                    <label className="form-check-label text-dark" htmlFor={`q-${q.question_id}-opt-${i}`}>
                      <strong>{opt[0]}.</strong> {opt.slice(3)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between mt-4">
            <button
              className="btn btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >⬅ Previous</button>
            <button className="btn btn-danger" onClick={prepareSubmit}>🚨 Submit Exam</button>
            <button
              className="btn btn-success"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >Next ➡</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Submission</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {unanswered.length > 0 ? (
                  <>
                    <p className="text-danger">You did not attempt the following questions:</p>
                    <p><strong>{unanswered.join(", ")}</strong></p>
                    <p>Are you sure you want to submit the exam?</p>
                  </>
                ) : (
                  <p>Are you sure you want to submit your exam?</p>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleSubmit}>Submit Now</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
