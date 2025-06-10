// src/components/GroupTestPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { submitTest } from '../api';
import { FaCopy, FaShareAlt } from 'react-icons/fa';

// Moved formatTime to top level
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function GroupTestPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  // Core state (removed unused secondsUntilStart/End)
  const [groupTest, setGroupTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [phase, setPhase] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [score, setScore] = useState(null);

  // Helper: compute how many whole seconds between now and a given Date object
  const computeSecondsBetween = (futureDate) => {
    const nowMs = Date.now();
    const thenMs = futureDate.getTime();
    return Math.max(0, Math.floor((thenMs - nowMs) / 1000));
  };

  // Define all event handlers at the top
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

  const handleStartButton = () => {
    
    setPhase(2);
    setTimeLeft(groupTest.duration_minutes * 60);
  };

  // Memoized submit
  const handleSubmitTest = useCallback(async () => {
    if (!groupTest) return;
    
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
      setPhase(3);
      setScore({
        correct: response.data.score,
        total: groupTest.question_count,
        percentage: Math.round((response.data.score / groupTest.question_count) * 100),
      });
      
      localStorage.removeItem(`testEndTime_${testId}`);
      localStorage.removeItem(`testAnswers_${testId}`);
    } catch (err) {
      setError('Failed to submit test');
    }
  }, [answers, groupTest, questions.length, testId]);

  // Save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`testAnswers_${testId}`, JSON.stringify(answers));
    }
  }, [answers, testId]);

  // // Save end time to localStorage when test starts
  useEffect(() => {
    if (phase === 2 && groupTest) {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + groupTest.duration_minutes);
      localStorage.setItem(`testEndTime_${testId}`, endTime.getTime());
    }
  }, [phase, groupTest, testId]);

  // Copy test link to clipboard
  const copyTestLink = () => {
    const testLink = `${window.location.origin}/group-test/${testId}`;
    navigator.clipboard.writeText(testLink)
      .then(() => {
        alert('Test link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy link. Please copy manually.');
      });
  };

  // Share test link using Web Share API
  const shareTestLink = () => {
    const testLink = `${window.location.origin}/group-test/${testId}`;
    
    if (navigator.share) {
      navigator.share({
        title: groupTest?.name || 'Group Test',
        text: 'Join this group test!',
        url: testLink,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      copyTestLink();
    }
  };

  useEffect(() => {
    // 1) Check authentication
    const token = localStorage.getItem('access_token');
    //setIsAuthenticated(!!token);
    
    if (!token) {
      // setIsLoading(false);
      // return navigate(`signin?next=/group-test/${testId}`);
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
        const fetchedQuestions = data.questions || [];
        setQuestions(fetchedQuestions);

        // Parse scheduled_start into a Date
        const startDate = new Date(data.scheduled_start);
        // Compute endDate = start + duration
        const endDate = new Date(startDate.getTime());
        endDate.setMinutes(endDate.getMinutes() + data.duration_minutes);

        // Check for saved test state
        const savedEndTime = localStorage.getItem(`testEndTime_${testId}`);
        const savedAnswers = localStorage.getItem(`testAnswers_${testId}`);
        
        // FIX: Don't return early - always set questions
        if (savedEndTime) {
          const endTimeMs = parseInt(savedEndTime, 10);
          const nowMs = Date.now();
          const remainingMs = endTimeMs - nowMs;
          
          if (remainingMs > 0) {
            // Test was in progress
            setPhase(2);
            setTimeLeft(Math.floor(remainingMs / 1000));
            
            // Load saved answers
            if (savedAnswers) {
              setAnswers(JSON.parse(savedAnswers));
            }
            // REMOVED EARLY RETURN - THIS WAS THE PROBLEM
          } else {
            // Test time expired
            localStorage.removeItem(`testEndTime_${testId}`);
            localStorage.removeItem(`testAnswers_${testId}`);
          }
        }

        // Determine initial phase based on current time
        const now = new Date();
        if (now < startDate) {
          // Phase 0: waiting for countdown
          setPhase(0);
          setTimeLeft(Math.floor((startDate - now) / 1000));
        } else if (now >= startDate && now < endDate) {
          // Phase 1: ready to start
          setPhase(1);
          setTimeLeft(Math.floor((endDate - now) / 1000));
        } else {
          // Test already expired
          setPhase(3);
          setTimeLeft(0);
        }

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load group test: ' + (err.response?.data?.detail || err.message));
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [testId]);

  // PHASE-0 TIMER: countdown to start
  useEffect(() => {
    if (phase !== 0 || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          setPhase(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, timeLeft]);

  // // PHASE-2 TIMER: actual test in progress
  useEffect(() => {
    if (phase !== 2 || timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [phase, timeLeft, handleSubmitTest]);

  // Safely get creator name
  const creatorName = groupTest?.created_by?.username || 'Unknown Creator';

  // —————————— RENDER LOGIC ——————————


  // if (!isAuthenticated) {
  //   return (
  //     <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200 text-center">
  //       <h2 className="text-2xl font-bold mb-4 text-gray-800">Authentication Required</h2>
  //       <p className="mb-6 text-gray-600">You need to be logged in to take this test.</p>
  //       <div className="flex justify-center space-x-4">
  //         <button
  //           onClick={() => navigate('/signin')}
  //           className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition duration-200"
  //         >
  //           Sign In
  //         </button>
  //         <button
  //           onClick={() => navigate('/signup')}
  //           className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition duration-200"
  //         >
  //           Sign Up
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => navigate('/signin')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  // // Safely get creator name
  // const creatorName = groupTest?.created_by?.username || 'Unknown Creator';

  // ——————— PHASE 0: Countdown to Start ———————
  if (phase === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{groupTest?.name || 'Group Test'}</h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-600 mb-6">
            {groupTest?.scheduled_start 
              ? `Test begins at: ${new Date(groupTest.scheduled_start).toLocaleString()}`
              : 'Test start time not set'}
          </p>
        </div>

        <div className="mb-10">
          <div className="bg-white rounded-xl shadow-md p-6 inline-block">
            <p className="text-sm text-gray-500 mb-2">Time until test starts</p>
            <p className="text-4xl font-bold text-blue-600">{formatTime(timeLeft)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8 text-left">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Test Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Course</p>
                <p className="font-medium">{groupTest?.course?.name || 'No course specified'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Questions</p>
                <p className="font-medium">{questions.length}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{groupTest?.duration_minutes || 0} minutes</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created by</p>
                <p className="font-medium">{creatorName}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Invite Participants</h3>
          <p className="text-gray-600 mb-4">Share this test with others:</p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={copyTestLink}
              className="flex items-center bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition duration-200"
            >
              <FaCopy className="mr-2" /> Copy Link
            </button>
            <button
              onClick={shareTestLink}
              className="flex items-center bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition duration-200"
            >
              <FaShareAlt className="mr-2" /> Share
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ——————— PHASE 1: Ready to Start (user must click “Start Test”) ———————
  if (phase === 1) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{groupTest?.name || 'Group Test'}</h1>
          <div className="w-24 h-1 bg-green-500 mx-auto mb-6"></div>
          <p className="text-gray-600 mb-6">
            {groupTest?.scheduled_start 
              ? `Scheduled start was: ${new Date(groupTest.scheduled_start).toLocaleString()}`
              : 'Test start time not set'}
          </p>
        </div>

        <div className="mb-10">
          <div className="bg-white rounded-xl shadow-md p-6 inline-block">
            <p className="text-sm text-gray-500 mb-2">Time available to complete the test</p>
            <p className="text-4xl font-bold text-green-600">
              {formatTime(groupTest?.duration_minutes * 60 || 0)}
            </p>
          </div>
        </div>

        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 text-left">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Instructions</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li style={{color:'green', fontSize:'20px', fontWeight:'700'}}>Refresh your window to start the test</li>
            <li>This test has {questions.length} multiple-choice questions</li>
            <li>You have {groupTest?.duration_minutes || 0} minutes to complete the test</li>
            <li>Answers are saved automatically as you progress</li>
            <li>You can navigate between questions using Previous/Next buttons</li>
            <li>Once you start, the timer cannot be paused</li>
          </ul>
        </div>

        <button
          onClick={handleStartButton}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition duration-200 shadow-md hover:shadow-lg"
          disabled={!groupTest || questions.length === 0}
        >
          {questions.length === 0 ? "Loading Questions..." : "Start Test Now"}
        </button>
      </div>
    );
  }

  // ... rest of the component remains the same with additional safeguards ...

  // ——————— PHASE 2: Test In Progress ———————
  if (phase === 2) {
    // Handle case where questions haven't loaded
    if (questions.length === 0) {
      return (
        <div className="max-w-md mx-auto p-8 text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Questions Loading</h2>
          <p className="text-gray-600 mb-4">
            {groupTest ? groupTest.name : 'Test'} questions are being prepared
          </p>
        </div>
      );
    }

    const currentQ = questions[currentQuestion];
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{groupTest?.name || 'Group Test'}</h2>
            <p className="text-sm text-gray-500">{groupTest?.course?.name || ''}</p>
          </div>
          <div className="flex items-center bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Time Left: {formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Question <span className="font-medium">{currentQuestion + 1}</span> of <span className="font-medium">{questions.length}</span>
            </p>
            <div className="flex space-x-1">
              {questions.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-3 h-3 rounded-full ${
                    currentQuestion === idx 
                      ? 'bg-blue-600' 
                      : answers[questions[idx]?.id] 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">{currentQ?.question_text || 'Question not available'}</h3>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((option, idx) => {
                const labelText = currentQ ? currentQ[`option_${option.toLowerCase()}`] : '';
                return (
                  <div key={idx} className="flex items-start">
                    <input
                      type="radio"
                      id={`option-${idx}`}
                      name="answer"
                      checked={answers[currentQ?.id] === option}
                      onChange={() => currentQ && handleAnswerChange(currentQ.id, option)}
                      className="mt-1 h-4 w-4 text-blue-600"
                      disabled={!currentQ}
                    />
                    <label 
                      htmlFor={`option-${idx}`} 
                      className={`ml-3 block p-3 rounded-lg w-full cursor-pointer transition duration-200 ${
                        answers[currentQ?.id] === option
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-medium mr-2">{option}.</span> {labelText || `Option ${option}`}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
              className={`flex items-center px-4 py-2 rounded-lg ${
                currentQuestion === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSubmitTest}
              className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition duration-200"
            >
              Submit Test
            </button>
            
            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // ——————— PHASE 3: Test Ended ———————
  if (phase === 3) {
    return (
      <div className="max-w-md mx-auto p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg border border-gray-100 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Test Completed</h1>
          <div className="w-24 h-1 bg-purple-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600">{groupTest?.name || 'Group Test'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="8"
                  strokeDasharray={`${score?.percentage || 0} ${100 - (score?.percentage || 0)}`}
                  strokeDashoffset="25"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
            <div className="relative z-10">
              <p className="text-5xl font-bold text-gray-800">
                {score?.percentage ?? 0}%
              </p>
            </div>
          </div>
          
          <p className="mt-6 text-gray-600">
            {score?.correct ?? 0} out of {score?.total ?? 0} questions correct
          </p>
          
          <div className="mt-6">
            <div className="flex justify-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {score?.correct ? Math.floor((score.correct / questions.length) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500">Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {questions.length || 0}
                </p>
                <p className="text-sm text-gray-500">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {groupTest?.duration_minutes || 0} min
                </p>
                <p className="text-sm text-gray-500">Duration</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition duration-200 shadow-md hover:shadow-lg"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return null;
}