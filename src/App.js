// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './components/login';

import ExamInstructions from './components/ExamInstructions';
import ExamPage from './components/ExamPage';
import ExamResponse from './components/ExamResponse';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/instructions" element={<ExamInstructions />} />
        <Route path="/exam" element={<ExamPage />} />
        <Route path="exam/response" element={<ExamResponse />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
