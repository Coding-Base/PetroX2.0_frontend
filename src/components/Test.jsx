import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTestSession, submitTest } from '../api';

export default function Test() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [failedList, setFailedList] = useState([]);

  // Shuffle util
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Load session
  useEffect(() => {
    fetchTestSession(sessionId)
      .then(res => {
        const data = res.data;
        if (data.questions) data.questions = shuffle(data.questions);
        setSession(data);
        setTimeLeft(data.duration || 300);
      })
      .catch(() => navigate('/dashboard'));
  }, [sessionId, navigate]);

  // Submit handler (hoisted above effect to fix warning)
  const handleSubmit = useCallback(() => {
    submitTest(sessionId, answers)
      .then(res => {
        const fails = session.questions.filter(q => {
          const correctAnswer = q.correct_option || q.correct_answer_text;
          return answers[q.id]?.trim().toLowerCase() !== correctAnswer?.trim().toLowerCase();
        });
        setFailedList(fails);
        setReviewMode(true);
      })
      .catch(() => alert('Submission error'));
  }, [session, answers, sessionId]);

  // Timer
  useEffect(() => {
    if (!session || reviewMode) return;
    if (timeLeft <= 0) return handleSubmit();
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, session, reviewMode, handleSubmit]);

  const handleChange = (qid, value) => 
    setAnswers(a => ({ ...a, [qid]: value }));

  if (!session) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Loading test...</p>
    </div>
  );

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test: {session.course.name}</h1>
        {!reviewMode && (
          <span className="text-lg font-mono">{Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}</span>
        )}
      </div>

      {/* Questions or Review */}
      {reviewMode ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Review Incorrect Answers</h2>
          {failedList.length === 0 ? (
            <p className="text-green-600">Great job! All correct.</p>
          ) : failedList.map((q, i) => (
            <div key={q.id} className="bg-white p-4 rounded-lg shadow">
              <p className="font-medium">{i+1}. {q.question_text}</p>
              <p>Your answer: <span className="font-semibold">{answers[q.id] || '—'}</span></p>
              <p>Correct answer: <span className="font-semibold">{q.correct_option || q.correct_answer_text}</span></p>
            </div>
          ))}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >Back to Dashboard</button>
        </div>
      ) : (
        <form className="space-y-8">
          {session.questions.map((q, idx) => (
            <div key={q.id} className="bg-white p-4 rounded-lg shadow">
              <p className="font-medium mb-2">{idx+1}. {q.question_text}</p>
              {q.option_a ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['A','B','C','D'].map(opt => (
                    <label key={opt} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt}
                        checked={answers[q.id]===opt}
                        onChange={() => handleChange(q.id, opt)}
                        className="form-radio"
                      />
                      <span>{q[`option_${opt.toLowerCase()}`]}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[q.id]||''}
                  onChange={e => handleChange(q.id, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your answer"
                />
              )}
            </div>
          ))}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >Submit</button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
