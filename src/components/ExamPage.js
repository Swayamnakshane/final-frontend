// import React, { useEffect, useState, useCallback, useRef } from "react";
// import api from "../api/api";
// import { useNavigate } from "react-router-dom";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap-icons/font/bootstrap-icons.css";

// const AWS_BANNER_URL = "https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230";

// const SessionWarningModal = ({ show, onHide, count }) => (
//   <div className={`modal fade ${show ? "show d-block" : "d-none"}`} tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
//     <div className="modal-dialog">
//       <div className="modal-content">
//         <div className="modal-header bg-warning">
//           <h5 className="modal-title">⚠️ Warning</h5>
//           <button type="button" className="btn-close" onClick={onHide}></button>
//         </div>
//         <div className="modal-body">
//           <p>
//             You have switched tabs <strong>{count}</strong> times. More than 4 switches will auto-submit your exam.
//           </p>
//         </div>
//         <div className="modal-footer">
//           <button type="button" className="btn btn-secondary" onClick={onHide}>
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// const statusColors = {
//   answered: "success",
//   notAnswered: "danger",
//   review: "warning",
//   notVisited: "secondary",
// };

// const ExamPage = () => {
//   const navigate = useNavigate();
//   const [questions, setQuestions] = useState([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState({});
//   const [markedForReview, setMarkedForReview] = useState({});
//   const [candidate, setCandidate] = useState("");
//   const [showSubmitModal, setShowSubmitModal] = useState(false);
//   const [tabSwitchCount, setTabSwitchCount] = useState(0);
//   const [warningMessage, setWarningMessage] = useState("");
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [examStarted, setExamStarted] = useState(false);
//   const [sessionWarning, setSessionWarning] = useState(false);
//   const [webcamStream, setWebcamStream] = useState(null);
//   const [cameraWarning, setCameraWarning] = useState(false);

//   const timerRef = useRef(null);
//   const videoRef = useRef(null);
//   const visibilityTimeout = useRef(null);
//   const endsAtRef = useRef(null);

//   const currentQuestion = questions[currentQuestionIndex];

//   const formatTime = () => {
//     const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
//     const seconds = (timeLeft % 60).toString().padStart(2, "0");
//     return `${minutes}:${seconds}`;
//   };

//   const toggleMarkForReview = () => {
//     if (!currentQuestion) return;
//     const qid = currentQuestion.question_id;
//     const updated = { ...markedForReview, [qid]: !markedForReview[qid] };
//     setMarkedForReview(updated);
//   };

//   const prepareSubmit = () => {
//     setShowSubmitModal(true);
//   };

//   const handleSubmit = useCallback(async () => {
//     if (timerRef.current) clearInterval(timerRef.current);
//     if (webcamStream) webcamStream.getTracks().forEach((t) => t.stop());

//     try {
//       await api.post("/candidate/submit/exam");
//       localStorage.removeItem("answers");
//       localStorage.removeItem("exam_ends_at");
//       navigate("/exam/response");
//     } catch {
//       navigate("/error", { state: { message: "Submission failed" } });
//     }
//   }, [navigate, webcamStream]);

//   useEffect(() => {
//     if (!examStarted || timeLeft <= 0) return;

//     timerRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         const newTime = prev - 1;
//         if (newTime <= 0) {
//           clearInterval(timerRef.current);
//           handleSubmit();
//           return 0;
//         }
//         return newTime;
//       });
//     }, 1000);

//     return () => clearInterval(timerRef.current);
//   }, [examStarted, timeLeft, handleSubmit]);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const [profileRes, questionsRes] = await Promise.all([
//           api.get("/candidate/profile"),
//           api.get("/candidate/get/questions"),
//         ]);

//         setCandidate(profileRes.data.candidate_name);
//         setQuestions(questionsRes.data.mcqs || []);

//         const savedAnswers = JSON.parse(localStorage.getItem("answers") || "{}");
//         const serverAnswers = await api.get("/candidate/get/all/answers");
//         setAnswers({ ...serverAnswers.data.answers, ...savedAnswers });

//         const storedEndsAt = localStorage.getItem("exam_ends_at");
//         endsAtRef.current = storedEndsAt;

//         if (!storedEndsAt) {
//           const { data } = await api.post("/candidate/start_exam");
//           endsAtRef.current = data.ends_at;
//           localStorage.setItem("exam_ends_at", data.ends_at);
//           setExamStarted(true);
//           setTimeLeft(Math.floor((new Date(data.ends_at) - new Date()) / 1000));
//         } else {
//           setTimeLeft(Math.floor((new Date(storedEndsAt) - new Date()) / 1000));
//           setExamStarted(true);
//         }
//       } catch {
//         navigate("/error", { state: { message: "Initialization failed" } });
//       }
//     };

//     loadData();
//   }, [navigate]);

//   useEffect(() => {
//     const handleVisibilityChange = async () => {
//       if (document.hidden) {
//         setSessionWarning(true);
//         try {
//           const { data } = await api.post("/candidate/log_tab_switch");
//           setTabSwitchCount(data.tab_switch_count);
//           if (data.auto_submitted) return handleSubmit();
//           setWarningMessage(data.message);
//           visibilityTimeout.current = setTimeout(() => setWarningMessage(""), 5000);
//         } catch (error) {
//           if (error.response?.status === 403) {
//             alert("Disqualified: " + error.response.data.message);
//             handleSubmit();
//           }
//         }
//       }
//     };

//     const blockShortcuts = (e) => {
//       if (
//         e.key === "F12" ||
//         (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) ||
//         (e.ctrlKey && ["r"].includes(e.key.toLowerCase()))
//       ) {
//         e.preventDefault();
//       }
//     };

//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     document.addEventListener("keydown", blockShortcuts);
//     document.addEventListener("contextmenu", (e) => e.preventDefault());

//     return () => {
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//       document.removeEventListener("keydown", blockShortcuts);
//       document.removeEventListener("contextmenu", (e) => e.preventDefault());
//       clearTimeout(visibilityTimeout.current);
//     };
//   }, [handleSubmit]);

//   useEffect(() => {
//     const streamWebcam = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//         if (videoRef.current) videoRef.current.srcObject = stream;
//         setWebcamStream(stream);
//       } catch (err) {
//         console.error("Webcam access denied", err);
//         setCameraWarning(true);
//       }
//     };

//     streamWebcam();

//     return () => {
//       const currentStream = videoRef.current?.srcObject;
//       if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
//     };
//   }, []);
//     const handleAnswer = (question_id, option) => {
//     const updatedAnswers = { ...answers, [question_id]: option };
//     setAnswers(updatedAnswers);
//     localStorage.setItem("answers", JSON.stringify(updatedAnswers));
//     api.post("/candidate/answer", { question_id, answer: option }).catch(() => {});
//   };

//   return (
//     <div className="container-fluid p-0 min-vh-100 d-flex flex-column bg-light overflow-hidden">
//       {/* Banner */}
//       <img
//         src={AWS_BANNER_URL}
//         className="w-100"
//         style={{ height: 235, objectFit: "cover" }}
//         alt="banner"
//       />

//       {/* Header */}
//       <div className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm">
//         <h4>Arcap Exam</h4>
//         <div className="text-end">
//           <div className="fs-5 text-danger fw-bold">{formatTime()}</div>
//           <small className="text-muted">Candidate: {candidate}</small>
//         </div>
//       </div>

//       {warningMessage && (
//         <div className="alert alert-danger m-3">
//           <i className="bi bi-exclamation-triangle me-2"></i>{warningMessage}
//         </div>
//       )}

//       {cameraWarning && (
//         <div className="alert alert-danger m-3">
//           <i className="bi bi-camera-video-off me-2"></i>
//           Camera access is required to take the exam. Please enable your webcam.
//         </div>
//       )}

//       <div className="row flex-grow-1 m-0 overflow-hidden">
//         {/* Left: Questions */}
//         <div className="col-lg-9 p-3 overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
//           <div className="card h-100 shadow-sm">
//             <div className="card-header bg-primary text-white d-flex justify-content-between">
//               <span>
//                 Question {currentQuestionIndex + 1} of {questions.length}
//               </span>
//             </div>
//             <div className="card-body overflow-auto">
//               <p className="fs-5 mb-4">{currentQuestion?.question}</p>
//               <div className="list-group">
//                 {currentQuestion?.options?.map((opt, idx) => (
//                   <label
//                     key={idx}
//                     className={`list-group-item list-group-item-action ${
//                       answers[currentQuestion?.question_id] === opt[0] ? "active" : ""
//                     }`}
//                   >
//                     <input
//                       type="radio"
//                       className="form-check-input me-3"
//                       name={`question-${currentQuestion?.question_id}`}
//                       checked={answers[currentQuestion?.question_id] === opt[0]}
//                       onChange={() => handleAnswer(currentQuestion.question_id, opt[0])}
//                     />
//                     <strong className="me-2">{opt[0]}.</strong> {opt.slice(3)}
//                   </label>
//                 ))}
//               </div>
//             </div>
//             <div className="card-footer d-flex justify-content-between">
//               <button
//                 className={`btn ${
//                   markedForReview[currentQuestion?.question_id] ? "btn-warning" : "btn-outline-warning"
//                 }`}
//                 onClick={toggleMarkForReview}
//               >
//                 <i className="bi bi-bookmark me-2" />
//                 {markedForReview[currentQuestion?.question_id] ? "Unmark Review" : "Mark for Review"}
//               </button>

//               <div>
//                 <button
//                   className="btn btn-outline-danger me-2"
//                   onClick={() => {
//                     const newAnswers = { ...answers };
//                     delete newAnswers[currentQuestion?.question_id];
//                     setAnswers(newAnswers);
//                     localStorage.setItem("answers", JSON.stringify(newAnswers));
//                   }}
//                 >
//                   Clear Response
//                 </button>
//                 <button
//                   className="btn btn-secondary me-2"
//                   disabled={currentQuestionIndex === 0}
//                   onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
//                 >
//                   Previous
//                 </button>
//                 <button
//                   className="btn btn-primary"
//                   onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, questions.length - 1))}
//                 >
//                   {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right: Palette + Camera */}
//         <div className="col-lg-3 p-3">
//           <div className="card h-100 shadow-sm">
//             <div className="card-header bg-info text-white">Question Palette</div>
//             <div className="card-body d-flex flex-column">
//               <div className="row mb-3 g-2">
//                 {Object.entries(statusColors).map(([label, color]) => (
//                   <div className="col-6 d-flex align-items-center" key={label}>
//                     <span className={`badge bg-${color} me-2`} style={{ width: 20, height: 20 }} />
//                     <small>{label}</small>
//                   </div>
//                 ))}
//               </div>
//               <div
//                 className="d-grid gap-2 mb-3"
//                 style={{ gridTemplateColumns: "repeat(5, 1fr)", display: "grid" }}
//               >
//                 {questions.map((q, idx) => {
//                   const status = answers[q.question_id]
//                     ? markedForReview[q.question_id]
//                       ? "review"
//                       : "answered"
//                     : markedForReview[q.question_id]
//                     ? "review"
//                     : "notVisited";

//                   return (
//                     <button
//                       key={q.question_id}
//                       className={`btn btn-sm btn-${statusColors[status]}`}
//                       onClick={() => setCurrentQuestionIndex(idx)}
//                     >
//                       {idx + 1}
//                     </button>
//                   );
//                 })}
//               </div>

//               <div className="text-center mt-auto">
//                 <div
//                   className="rounded-circle overflow-hidden border mb-2"
//                   style={{ width: 120, height: 120 }}
//                 >
//                   <video
//                     ref={videoRef}
//                     width="120"
//                     height="120"
//                     muted
//                     autoPlay
//                     playsInline
//                     style={{ objectFit: "cover", transform: "scaleX(-1)" }}
//                   />
//                 </div>
//                 <small className="text-muted">Live Proctoring</small>

//                 <button className="btn btn-danger w-100 mt-3" onClick={prepareSubmit}>
//                   <i className="bi bi-check-circle me-2" /> Submit Exam
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Submit Modal */}
//       {showSubmitModal && (
//         <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
//           <div className="modal-dialog">
//             <div className="modal-content">
//               <div className="modal-header bg-danger text-white">
//                 <h5 className="modal-title">
//                   <i className="bi bi-exclamation-triangle me-2" />
//                   Confirm Submission
//                 </h5>
//               </div>
//               <div className="modal-body">
//                 {questions.filter((q) => !answers[q.question_id]).length > 0 ? (
//                   <div className="alert alert-warning">You have unanswered questions.</div>
//                 ) : null}
//                 <p>Are you sure you want to submit your exam?</p>
//               </div>
//               <div className="modal-footer">
//                 <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>
//                   Cancel
//                 </button>
//                 <button className="btn btn-danger" onClick={handleSubmit}>
//                   Confirm Submit
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Tab Warning Modal */}
//       <SessionWarningModal show={sessionWarning} onHide={() => setSessionWarning(false)} count={tabSwitchCount} />
//     </div>
//   );
// };

// export default ExamPage;

import React, { useEffect, useState, useCallback, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const AWS_BANNER_URL =
  "https://github.com/user-attachments/assets/6d0ce198-1343-4968-a71d-3e97bbcf5230";

const CameraPermissionModal = ({ show, onRetry }) => (
  <div
    className={`modal fade ${show ? "show d-block" : "d-none"}`}
    tabIndex="-1"
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
  >
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header bg-danger text-white">
          <h5 className="modal-title">
            <i className="bi bi-camera-video-off me-2" /> Camera Access Required
          </h5>
        </div>
        <div className="modal-body">
          <p>Please enable your webcam to continue answering questions.</p>
          <p>This is required for live proctoring during your exam.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onRetry}>
            Grant Access
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
  const [candidate, setCandidate] = useState("");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(false);

  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const visibilityTimeout = useRef(null);
  const endsAtRef = useRef(null);

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
    setShowSubmitModal(true);
  };

  const handleSubmit = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (webcamStream) webcamStream.getTracks().forEach((t) => t.stop());

    try {
      await api.post("/candidate/submit/exam");
      localStorage.removeItem("answers");
      localStorage.removeItem("exam_ends_at");
      navigate("/exam/response");
    } catch {
      navigate("/error", { state: { message: "Submission failed" } });
    }
  }, [navigate, webcamStream]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setWebcamStream(stream);
      setCameraPermission(true);
    } catch (err) {
      setCameraPermission(false);
      setWebcamStream(null);
    }
  }, []);

  useEffect(() => {
    streamWebcam();
    return () => {
      const currentStream = videoRef.current?.srcObject;
      if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
    };
  }, [streamWebcam]);
  // ... existing code ...

  const handleAnswer = (question_id, option) => {
    if (!cameraPermission) return;
    const updatedAnswers = { ...answers, [question_id]: option };
    setAnswers(updatedAnswers);
    localStorage.setItem("answers", JSON.stringify(updatedAnswers));
    api.post("/candidate/answer", { question_id, answer: option }).catch(() => {});
  };

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

 
  return (
  <div className="container-fluid p-0 min-vh-100 d-flex flex-column bg-light overflow-hidden">
    {/* Banner */}
    <img
      src={AWS_BANNER_URL}
      className="w-100"
      style={{ height: 235, objectFit: "cover" }}
      alt="banner"
    />

    {/* Header */}
    <div className="d-flex justify-content-between align-items-center p-3 bg-white shadow-sm">
      <h4>Arcap Exam</h4>
      <div className="text-end">
        <div className="fs-5 text-danger fw-bold">{formatTime()}</div>
        <small className="text-muted">Candidate: {candidate}</small>
      </div>
    </div>

    {warningMessage && (
      <div className="alert alert-danger m-3">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {warningMessage}
      </div>
    )}

    <div className="row flex-grow-1 m-0 overflow-hidden">
      {/* Left: Questions */}
      <div className="col-lg-9 p-3 overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          </div>
          <div className="card-body overflow-auto">
            <p className="fs-5 mb-4">{currentQuestion?.question}</p>
            <div className="list-group">
              {currentQuestion?.options?.map((opt, idx) => (
                <label
                  key={idx}
                  className={`list-group-item list-group-item-action ${
                    answers[currentQuestion?.question_id] === opt[0] ? "active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    className="form-check-input me-3"
                    name={`question-${currentQuestion?.question_id}`}
                    checked={answers[currentQuestion?.question_id] === opt[0]}
                    onChange={() =>
                      cameraPermission && handleAnswer(currentQuestion.question_id, opt[0])
                    }
                    disabled={!cameraPermission}
                  />
                  <strong className="me-2">{opt[0]}.</strong> {opt.slice(3)}
                </label>
              ))}
            </div>
          </div>
          <div className="card-footer d-flex justify-content-between">
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

            <div>
              <button
                className="btn btn-outline-danger me-2"
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
                className="btn btn-secondary me-2"
                disabled={currentQuestionIndex === 0}
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
              >
                Previous
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(prev + 1, questions.length - 1)
                  )
                }
              >
                {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Palette + Camera */}
      <div className="col-lg-3 p-3">
        <div className="card h-100 shadow-sm">
          <div className="card-header bg-info text-white">Question Palette</div>
          <div className="card-body d-flex flex-column">
            <div className="row mb-3 g-2">
              {Object.entries(statusColors).map(([label, color]) => (
                <div className="col-6 d-flex align-items-center" key={label}>
                  <span className={`badge bg-${color} me-2`} style={{ width: 20, height: 20 }} />
                  <small>{label}</small>
                </div>
              ))}
            </div>
            <div
              className="d-grid gap-2 mb-3"
              style={{ gridTemplateColumns: "repeat(5, 1fr)", display: "grid" }}
            >
              {questions.map((q, idx) => {
                const status = answers[q.question_id]
                  ? markedForReview[q.question_id]
                    ? "review"
                    : "answered"
                  : markedForReview[q.question_id]
                  ? "review"
                  : "notVisited";

                return (
                  <button
                    key={q.question_id}
                    className={`btn btn-sm btn-${statusColors[status]}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="text-center mt-auto">
              <div
                className="rounded-circle overflow-hidden border mb-2"
                style={{ width: 120, height: 120 }}
              >
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
              <small className="text-muted">Live Proctoring</small>

              <button className="btn btn-danger w-100 mt-3" onClick={prepareSubmit}>
                <i className="bi bi-check-circle me-2" /> Submit Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Submit Modal */}
    {showSubmitModal && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">
                <i className="bi bi-exclamation-triangle me-2" />
                Confirm Submission
              </h5>
            </div>
            <div className="modal-body">
              {questions.filter((q) => !answers[q.question_id]).length > 0 ? (
                <div className="alert alert-warning">You have unanswered questions.</div>
              ) : null}
              <p>Are you sure you want to submit your exam?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleSubmit}>
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Camera Permission Modal */}
    <CameraPermissionModal show={!cameraPermission} onRetry={streamWebcam} />
  </div>
);


   
};

export default ExamPage;

