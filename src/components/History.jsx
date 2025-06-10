// src/components/History.jsx
import React, { useEffect, useState } from 'react';
import { fetchHistory } from '../api';
import { useNavigate } from 'react-router-dom';
import { fetchTestSession } from '../api';
export default function History() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory()
      .then(res => setRecords(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    fetchTestSession()
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-600">Test History</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >Back</button>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : records.length === 0 ? (
          <p className="text-gray-600">You haven't taken any tests yet.</p>
        ) : (
          <div className="space-y-4">
            {records.map(rec => (
              <div key={rec.id} className="p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold">{rec.course.name}</p>
                  <p className="text-sm text-gray-600">
                    Taken on: {new Date(rec.start_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full">
                    Score: {rec.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
