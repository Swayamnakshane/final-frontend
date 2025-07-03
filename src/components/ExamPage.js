import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ExamPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [unanswered, setUnanswered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("answers");
    return saved ? JSON.parse(saved) : {};
  });
  const [candidate, setCandidate] = useState("Candidate");
  const [showModal, setShowModal] = useState(false);

  const questionsPerPage = 2;
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem("exam_timer");
    return saved ? parseInt(saved) : 3600;
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    axios
      .get("http://127.0.0.1:5000/candidate/get/questions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setQuestions(res.data.mcqs));

    axios
      .get("http://127.0.0.1:5000/candidate/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCandidate(res.data.candidate_name));
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("exam_timer", timeLeft);
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    localStorage.setItem("answers", JSON.stringify(answers));
  }, [answers]);

  const handleAnswer = (qid, optIndex) => {
    const selectedLetter = String.fromCharCode(65 + optIndex);
    setAnswers({ ...answers, [qid]: selectedLetter });

    const token = localStorage.getItem("token");
    axios
      .post(
        "http://127.0.0.1:5000/candidate/answer",
        { question_id: qid, answer: selectedLetter },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch(console.error);
  };

  const handleSubmit = () => {
    const token = localStorage.getItem("token");
    axios
      .post("http://127.0.0.1:5000/candidate/submit/exam", {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        localStorage.removeItem("exam_timer");
        localStorage.removeItem("answers");
        navigate("/exam/response");
      })
      .catch(console.error);
  };

  const prepareSubmit = () => {
    const unansweredQs = questions
      .map((q, i) => (!answers[q.question_id] ? i + 1 : null))
      .filter((n) => n !== null);
    setUnanswered(unansweredQs);
    setShowModal(true);
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const paginatedQuestions = questions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  return (
    <div className="container-fluid bg-light min-vh-100 py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white shadow rounded">
        <h4 className="text-primary mb-0">
          <i className="bi bi-person-circle me-2"></i> {candidate}
        </h4>
        <h5 className="text-danger mb-0">
          <i className="bi bi-clock me-2"></i> {formatTime()}
        </h5>
      </div>

      <div className="row">
        {/* Left Sidebar with Question Numbers */}
        <div className="col-md-2 mb-4">
          <div className="bg-white shadow rounded p-3">
            <h6 className="text-center mb-3 text-secondary">📘 Questions</h6>
            <div className="d-flex flex-wrap justify-content-center">
              {questions.map((q, i) => (
                <button
                  key={i}
                  className={`btn m-1 btn-sm ${
                    answers[q.question_id] ? "btn-success" : "btn-outline-dark"
                  }`}
                  onClick={() =>
                    setCurrentPage(Math.floor(i / questionsPerPage) + 1)
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Questions + Navigation */}
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
                      checked={
                        answers[q.question_id] === String.fromCharCode(65 + i)
                      }
                      onChange={() => handleAnswer(q.question_id, i)}
                    />
                    <label
                      className="form-check-label text-dark"
                      htmlFor={`q-${q.question_id}-opt-${i}`}
                    >
                      <strong>{String.fromCharCode(65 + i)}.</strong> {opt}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-4">
            <button
              className="btn btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ⬅ Previous
            </button>

            <button
              className="btn btn-danger"
              onClick={prepareSubmit}
            >
              🚨 Submit Exam
            </button>

            <button
              className="btn btn-success"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next ➡
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Submission</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {unanswered.length > 0 ? (
                  <>
                    <p className="text-danger">
                      You did not attempt the following questions:
                    </p>
                    <p><strong>{unanswered.join(", ")}</strong></p>
                    <p>Are you sure you want to submit the exam?</p>
                  </>
                ) : (
                  <p>Are you sure you want to submit your exam?</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleSubmit}>
                  Submit Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
