// src/components/GroupTestPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { submitTest } from '../api';

export default function GroupTestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // Core state:
  const [groupTest, setGroupTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // These track “absolute” times:
  const [secondsUntilStart, setSecondsUntilStart] = useState(null);
  const [secondsUntilEnd, setSecondsUntilEnd] = useState(null);

  // three phases:
  //   0 = countdown to start
  //   1 = ready to start (user must click “Start Test”)
  //   2 = test in progress (timer ticking)
  //   3 = test ended
  const [phase, setPhase] = useState(0);

  // Remaining seconds in whichever phase—used for display
  const [timeLeft, setTimeLeft] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Helper: compute how many whole seconds between now and a given Date object
  const computeSecondsBetween = (futureDate) => {
    const nowMs = Date.now();
    const thenMs = futureDate.getTime();
    return Math.max(0, Math.floor((thenMs - nowMs) / 1000));
  };

  // Memoized submit: if user attempts to submit before end, confirm first
  const handleSubmitTest = useCallback(async () => {
    // If test is in progress but not yet ended, confirm early submission
    const now = new Date();
    const endDate = new Date(groupTest.scheduled_start);
    endDate.setMinutes(endDate.getMinutes() + groupTest.duration_minutes);

    if (now.getTime() < endDate.getTime()) {
      const confirmEarly = window.confirm(
        'The test has not yet run its full duration. Are you sure you want to submit early?'
      );
      if (!confirmEarly) {
        return;
      }
    }

    try {
      const response = await submitTest(groupTest.session_id, answers);
      // Display final score
      setPhase(3);
      setScore({
        correct: response.data.score,
        total: questions.length,
        percentage: Math.round((response.data.score / questions.length) * 100),
      });
    } catch (err) {
      setError('Failed to submit test');
    }
  }, [answers, groupTest, questions.length]);

  // score state
  const [score, setScore] = useState(null);

  useEffect(() => {
    // 1) Check authentication
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    if (!token) {
      setIsLoading(false);
      return;
    }

    // 2) Fetch the GroupTest details
    const fetchTest = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/group-test/${testId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = response.data;
        setGroupTest(data);
        setQuestions(data.questions || []); // questions array may be empty until started

        // Parse scheduled_start into a Date (browser will interpret ISO with “Z” as UTC)
        const startDate = new Date(data.scheduled_start);
        // Compute endDate = start + duration
        const endDate = new Date(startDate.getTime());
        endDate.setMinutes(endDate.getMinutes() + data.duration_minutes);

        const secsToStart = computeSecondsBetween(startDate);
        const secsToEnd = computeSecondsBetween(endDate);

        setSecondsUntilStart(secsToStart);
        setSecondsUntilEnd(secsToEnd);

        // Determine initial phase:
        if (secsToStart > 0) {
          // Phase 0: waiting for countdown
          setPhase(0);
          setTimeLeft(secsToStart);
        } else if (secsToStart <= 0 && secsToEnd > 0) {
          // We are between start and end; test is “ready” but user hasn't clicked start yet → Phase 1
          setPhase(1);
          setTimeLeft(data.duration_minutes * 60);
        } else {
          // secsToEnd ≤ 0 → test is already expired → Phase 3 (ended)
          setPhase(3);
          setTimeLeft(0);
          // We could optionally fetch the final score from backend here, but for simplicity
          // we’ll just show “expired” or direct to Dashboard/SignIn.
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load group test');
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // PHASE‐0 TIMER: countdown to start
  useEffect(() => {
    if (phase !== 0 || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          // Move to Phase 1: “Ready to Start”
          setPhase(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, timeLeft]);

  // PHASE‐1: “Ready to Start”— no timer until user clicks “Start Test”

  // PHASE‐2 TIMER: actual test in progress
  useEffect(() => {
    if (phase !== 2 || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          // Move to Phase 3: test ended automatically
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, timeLeft, handleSubmitTest]);

  const handleStartButton = () => {
    // User clicked “Start Test” in Phase 1
    setPhase(2);
    setTimeLeft(groupTest.duration_minutes * 60);
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // —————————— RENDER LOGIC ——————————

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="mb-6">You need to be logged in to take this test.</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/signin')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p>Loading test…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-100 text-red-700 rounded-xl text-center">
        <p>{error}</p>
        <button
          onClick={() => navigate('/signin')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  // ——————— PHASE 0: Countdown to Start ———————
  if (phase === 0) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Test Not Started</h2>
        <p className="text-lg mb-2">{groupTest.name}</p>
        <p className="mb-4">
          Test begins at: {new Date(groupTest.scheduled_start).toLocaleString()}
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm mb-1">Time until test starts:</p>
          <p className="text-3xl font-bold">{formatTime(timeLeft)}</p>
        </div>

        <div className="text-left bg-blue-50 p-4 rounded-lg mb-6">
          <p className="font-semibold">Test Details:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Course: {groupTest.course.name}</li>
            <li>Questions: {groupTest.question_count}</li>
            <li>Duration: {groupTest.duration_minutes} minutes</li>
          </ul>
        </div>
      </div>
    );
  }

  // ——————— PHASE 1: Ready to Start (user must click “Start Test”) ———————
  if (phase === 1) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Test Is Ready</h2>
        <p className="text-lg mb-2">{groupTest.name}</p>
        <p className="mb-4">
          Scheduled start was:{' '}
          {new Date(groupTest.scheduled_start).toLocaleString()}
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-6">
          <p className="text-sm mb-1">Time remaining to submit after start:</p>
          <p className="text-3xl font-bold">
            {formatTime(groupTest.duration_minutes * 60)}
          </p>
        </div>

        <button
          onClick={handleStartButton}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
        >
          Start Test
        </button>
      </div>
    );
  }

  // ——————— PHASE 2: Test In Progress ———————
  if (phase === 2) {
    if (questions.length === 0) {
      // If backend didn’t supply questions yet, show a brief loading state
      return (
        <div className="max-w-md mx-auto p-6 text-center">
          <p>Loading questions…</p>
        </div>
      );
    }

    const currentQ = questions[currentQuestion];
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{groupTest.name}</h2>
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg">
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-2">
            Question {currentQuestion + 1} of {questions.length}
          </p>
          <h3 className="text-lg font-medium mb-4">{currentQ.question_text}</h3>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option, idx) => {
              const labelText = currentQ[`option_${option.toLowerCase()}`];
              return (
                <div key={idx} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${idx}`}
                    name="answer"
                    checked={answers[currentQ.id] === option}
                    onChange={() => handleAnswerChange(currentQ.id, option)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <label htmlFor={`option-${idx}`} className="ml-3 block">
                    {labelText}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className={`bg-gray-200 px-4 py-2 rounded-lg ${
              currentQuestion === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmitTest}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Submit Test
            </button>
          )}
        </div>
      </div>
    );
  }

  // ——————— PHASE 3: Test Ended ———————
  if (phase === 3) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4">Test Completed</h2>
        <p className="text-lg mb-2">{groupTest.name}</p>

        <div className="bg-blue-100 p-6 rounded-lg mb-6">
          <p className="text-4xl font-bold text-blue-700">
            {score?.percentage ?? 0}%
          </p>
          <p className="mt-2">
            {score?.correct ?? 0} out of {score?.total ?? 0} questions correct
          </p>
        </div>

        <button
          onClick={() => navigate('/signin')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return null;
}

