import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchCourses, 
  startTest, 
  fetchLeaderboard,
  fetchUserHistory,
  fetchUserRank
} from '../api';
import Chat from './chat';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import logo from "./whitelogo.png";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [testDuration, setTestDuration] = useState(300);
  const [showTestForm, setShowTestForm] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [userName, setUserName] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRank, setUserRank] = useState(null);  // Added for backend rank
  const [isLoading, setIsLoading] = useState({
    leaderboard: true,
    history: true,
    courses: true,
    rank: true  // Added loading state for rank
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch courses
    fetchCourses()
      .then(res => {
        setCourses(res.data);
        setIsLoading(prev => ({ ...prev, courses: false }));
      })
      .catch(err => {
        console.error('Failed to load courses');
        setIsLoading(prev => ({ ...prev, courses: false }));
      });
    
    // Fetch leaderboard data
    fetchLeaderboard()
      .then(res => {
        console.log('Leaderboard data:', res.data);
        setLeaderboard(res.data);
        setIsLoading(prev => ({ ...prev, leaderboard: false }));
      })
      .catch(err => {
        console.error('Failed to load leaderboard', err);
        setIsLoading(prev => ({ ...prev, leaderboard: false }));
      });
    
    // Fetch user's test history
    fetchUserHistory()
      .then(res => {
        setTestHistory(res.data);
        setIsLoading(prev => ({ ...prev, history: false }));
      })
      .catch(err => {
        console.error('Failed to load history');
        setIsLoading(prev => ({ ...prev, history: false }));
      });
    
    // Fetch user rank from backend
    fetchUserRank()
      .then(res => {
        setUserRank(res.data.rank);
        setIsLoading(prev => ({ ...prev, rank: false }));
      })
      .catch(err => {
        console.error('Failed to load user rank', err);
        setIsLoading(prev => ({ ...prev, rank: false }));
      });
    
    // Get username from local storage
    const storedName = localStorage.getItem('username') || 'User';
    setUserName(storedName);
  }, []);

  const handleStartTest = () => {
    if (!selectedCourse) { 
      alert('Select a course'); 
      return; 
    }
    startTest(selectedCourse, questionCount, testDuration)
      .then(res => navigate(`/test/${res.data.id}`))
      .catch(err => alert('Error starting test'));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/signin');
  };

  // Prepare chart data from real test history
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Test Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Score (%)'
        },
        min: 0,
        max: 100
      }
    }
  };

  // Format test history for chart
  const getChartData = () => {
    // Sort history by date
    const sortedHistory = [...testHistory].sort((a, b) => 
      new Date(a.end_time) - new Date(b.end_time)
    );
    
    return {
      labels: sortedHistory.map(session => 
        new Date(session.end_time).toLocaleDateString()
      ),
      datasets: [
        {
          label: 'Your Performance',
          data: sortedHistory.map(session => 
            Math.round((session.score / session.questions.count) * 100)
          ),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
        }
      ]
    };
  };

  // Calculate stats from real data
  const calculateStats = () => {
    const testsTaken = testHistory.length;
    const totalScore = testHistory.reduce((sum, session) => {
      return sum + (session.score / session.questions.count);
    }, 0);
    const averageScore = testsTaken > 0 
      ? Math.round((totalScore / testsTaken) * 100) 
      : 0;
    
    return {
      testsTaken,
      averageScore,
      currentRank: userRank
    };
  };

  const stats = calculateStats();
  const chartData = getChartData();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-blue-800 text-white p-6 flex flex-col">
        <div className="flex justify-center mb-8">
          <img 
            src={logo} 
            alt="Petrox logo" 
            className="h-24 object-contain"
          />
        </div>
        
        <div className="space-y-3 flex-1">
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'createTest' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => {
              setActiveTab('createTest');
              setShowTestForm(true);
            }}
          >
            Create Test
          </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'createGroupTest' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => {
              setActiveTab('createGroupTest');
              navigate('/create-group');
            }}
          >
            Create Group Test
          </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'history' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'settings' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
        
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {userName} 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Track your progress and take new tests
          </p>
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">Tests Taken</h3>
                {isLoading.history ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-2 text-blue-600">{stats.testsTaken}</p>
                    <p className="text-sm text-gray-500 mt-1">Total tests completed</p>
                  </>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">Average Score</h3>
                {isLoading.history ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-2 text-green-600">{stats.averageScore}%</p>
                    <p className="text-sm text-gray-500 mt-1">Across all tests</p>
                  </>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-700">Current Rank</h3>
                {isLoading.rank ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
                ) : (
                  <>
                    <p className="text-3xl font-bold mt-2 text-purple-600">
                      {userRank ? `#${userRank}` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Global ranking</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Charts and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Your Performance
                </h2>
                {isLoading.history ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-gray-500">Loading performance data...</div>
                  </div>
                ) : testHistory.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-gray-500">No test data available</div>
                  </div>
                )}
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Leaderboard
                </h2>
                {isLoading.leaderboard ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : leaderboard && leaderboard.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Rank</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Score</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Course</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {leaderboard
                          .sort((a, b) => (b.score / b.question_count) - (a.score / a.question_count))
                          .map((user, index) => (
                            <tr key={user.id || index}>
                              <td className="px-4 py-3 text-sm">{index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium">
                                {user.user?.username || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-sm text-blue-600 font-semibold">
                                {user.question_count > 0 
                                  ? `${Math.round((user.score / user.question_count) * 100)}%`
                                  : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {user.course?.name || 'N/A'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-gray-500">
                      {leaderboard === null ? 'Error loading leaderboard' : 'No leaderboard data available'}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('createTest');
                    setShowTestForm(true);
                  }}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-lg font-medium transition"
                >
                  Start New Test
                </button>
                
                <button 
                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 rounded-lg font-medium transition"
                  onClick={() => navigate('/create-group')}
                >
                  Create Group Test
                </button>
                
                <button 
                  onClick={() => setActiveTab('history')}
                  className="bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-lg font-medium transition"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Test Form */}
        {activeTab === 'createTest' && (
          <div className="bg-white p-8 rounded-xl shadow-md max-w-3xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
              Create New Test
            </h2>
            
            {showTestForm ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  {isLoading.courses ? (
                    <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                  ) : (
                    <select
                      value={selectedCourse}
                      onChange={e => setSelectedCourse(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a course</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      value={questionCount}
                      onChange={e => setQuestionCount(+e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={testDuration / 60}
                      onChange={e => setTestDuration(+e.target.value * 60)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleStartTest}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-4"
                >
                  Begin Test
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="bg-blue-100 p-4 rounded-xl inline-block mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Create a New Test
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure your test settings to get started
                </p>
                <button
                  onClick={() => setShowTestForm(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Configure Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Test History
            </h2>
            {isLoading.history ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : testHistory.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testHistory.map(session => {
                      const start = new Date(session.start_time);
                      const end = new Date(session.end_time);
                      const duration = Math.round((end - start) / 60000); // in minutes
                      const scorePercentage = Math.round((session.score / session.questions.count) * 100);
                      
                      return (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.course.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {end.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span className={scorePercentage >= 70 ? 'text-green-600' : 'text-yellow-600'}>
                              {scorePercentage}%
                            </span>
                            <span className="text-gray-500 text-xs block">
                              ({session.score}/{session.questions.count})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {duration} min
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-gray-500">No test history available</div>
                <button
                  onClick={() => {
                    setActiveTab('createTest');
                    setShowTestForm(true);
                  }}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Take Your First Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Account Settings
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">
                  Notification Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Email notifications
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Push notifications
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Component */}
        <div className="mt-10 max-w-4xl mx-auto">
          <Chat />
        </div>
      </div>
    </div>
  );
}