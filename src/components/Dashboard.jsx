import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchCourses, 
  startTest, 
  fetchLeaderboard,
  fetchUserHistory,
  fetchUserRank,
  fetchUserUploadStats // ADDED: Now properly imported
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

// PetroMark AI Widget Component
const PetroMarkAI = () => {
  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]');
    
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
      script.async = true;
      script.type = 'text/javascript';
      document.head.appendChild(script);
    }
    
    return () => {
      // Clean up if needed
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <elevenlabs-convai agent-id="agent_01jx3tjzhyfjnt6cxax880pxx4"></elevenlabs-convai>
      </div>
    </div>
  );
};

// RANK CONFIGURATION
const RANK_THRESHOLDS = {
  5: 'Lieutenant',
  10: 'Commander',
  15: 'Captain',
  20: 'Vice Admiral',
  25: 'General'
};

// Calculate user rank based on approved uploads
const calculateRank = (approvedUploads) => {
  const thresholds = Object.keys(RANK_THRESHOLDS)
    .map(Number)
    .sort((a, b) => a - b);
  
  let currentRank = 'Recruit';
  let nextRank = null;
  let uploadsNeeded = 0;
  
  for (const threshold of thresholds) {
    if (approvedUploads >= threshold) {
      currentRank = RANK_THRESHOLDS[threshold];
    } else {
      if (!nextRank) {
        nextRank = RANK_THRESHOLDS[threshold];
        uploadsNeeded = threshold - approvedUploads;
      }
    }
  }
  
  return {
    currentRank,
    nextRank,
    uploadsNeeded
  };
};

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
  const [userRank, setUserRank] = useState(null);
  // ADDED: Upload stats state
  const [uploadStats, setUploadStats] = useState({
    approvedUploads: 0,
    rankInfo: { currentRank: 'Recruit', nextRank: 'Lieutenant', uploadsNeeded: 5 }
  });
  const [isLoading, setIsLoading] = useState({
    leaderboard: true,
    history: true,
    courses: true,
    rank: true,
    uploadStats: true // ADDED: Loading state for upload stats
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  useEffect(() => {
    fetchCourses()
      .then(res => {
        setCourses(res.data);
        setIsLoading(prev => ({ ...prev, courses: false }));
      })
      .catch(err => {
        console.error('Failed to load courses');
        setIsLoading(prev => ({ ...prev, courses: false }));
      });
    
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
    
    fetchUserHistory()
      .then(res => {
        setTestHistory(res.data);
        setIsLoading(prev => ({ ...prev, history: false }));
      })
      .catch(err => {
        console.error('Failed to load history');
        setIsLoading(prev => ({ ...prev, history: false }));
      });
    
    fetchUserRank()
      .then(res => {
        setUserRank(res.data.rank);
        setIsLoading(prev => ({ ...prev, rank: false }));
      })
      .catch(err => {
        console.error('Failed to load user rank', err);
        setIsLoading(prev => ({ ...prev, rank: false }));
      });
    
    // ADDED: Fetch user upload stats
    fetchUserUploadStats()
      .then(res => {
        const approvedUploads = res.data.approved_uploads || 0;
        setUploadStats({
          approvedUploads,
          rankInfo: calculateRank(approvedUploads)
        });
        setIsLoading(prev => ({ ...prev, uploadStats: false }));
      })
      .catch(err => {
        console.error('Failed to load upload stats', err);
        setIsLoading(prev => ({ ...prev, uploadStats: false }));
      });
    
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
    maintainAspectRatio: false,
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
            session.questions && session.questions.count > 0
              ? Math.round((session.score / session.questions.count) * 100)
              : 0
          ),
          borderColor: 'rgba(79, 70, 229, 1)',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.3,
        }
      ]
    };
  };

  // Calculate stats from real data
 const calculateStats = () => {
        const testsTaken = testHistory.length;
        let totalScorePercentage = 0;
        let scoredTests = 0;

     testHistory.forEach(session => {
            const questionCount = session.questions?.length || 0;
            if (questionCount > 0) {
                const sessionScore = (session.score / questionCount) * 100;
                totalScorePercentage += sessionScore;
                scoredTests++;
            }
        });

    const averageScore = scoredTests > 0
            ? Math.round(totalScorePercentage / scoredTests)
            : 0;

        return {
            testsTaken,
            averageScore,
            currentRank: userRank,
        };
    };
  const stats = calculateStats();
  const chartData = getChartData();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-blue-800 text-white">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold">Study Dashboard</h1>
        <div className="w-10"></div>
      </div>

      {/* Sidebar - Mobile Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div 
            ref={menuRef}
            className="w-64 h-full bg-blue-800 text-white p-6 flex flex-col animate-slide-in"
          >
            <div className="flex justify-between items-center mb-8">
              <img 
                src={logo} 
                alt="Petrox logo" 
                className="h-20 object-contain"
              />
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="text-white p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 flex-1">
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('dashboard');
                  setShowMobileMenu(false);
                }}
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
                  setShowMobileMenu(false);
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
                  setShowMobileMenu(false);
                }}
              >
                Create Group Test
              </button>


              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === 'UploadPastQuestions' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('UploadPastQuestions');
                  navigate('/upload');
                  setShowMobileMenu(false);
                }}
              >
                Upload Past Questions
              </button>
              
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === 'MaterialManagement' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('MaterialManagement');
                  navigate('/material');
                  setShowMobileMenu(false);
                }}
              >
                Material Management
              </button>
              
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === 'petromark' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('petromark');
                  setShowMobileMenu(false);
                }}
              >
                PetroMark AI
              </button>
              
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === 'history' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('history');
                  setShowMobileMenu(false);
                }}
              >
                History
              </button>
              
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  activeTab === 'settings' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('settings');
                  setShowMobileMenu(false);
                }}
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
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 bg-blue-800 text-white p-6 flex-col">
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
                  activeTab === 'UploadPastQuestions' 
                    ? 'bg-blue-600' 
                    : 'hover:bg-blue-700'
                }`}
                onClick={() => {
                  setActiveTab('UploadPastQuestions');
                  navigate('/upload');
                  setShowMobileMenu(false);
                }}
              >
                Upload Past Questions
              </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'MaterialManagement' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => {
              setActiveTab('MaterialManagement');
              navigate('/material');
            }}
          >
            Material Management
          </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'petromark' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => setActiveTab('petromark')}
          >
            PetroMark AI
          </button>
          
          <button
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'history' 
                ? 'bg-blue-600' 
                : 'hover:bg-blue-700'
            }`}
            onClick={() => {
              setActiveTab('history');
            }}
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
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* Welcome Header - UPDATED with rank display */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Welcome, {userName} 👋
            </h1>
            {!isLoading.uploadStats && uploadStats.rankInfo.currentRank !== 'Recruit' && (
              <span className="ml-3 bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
                {uploadStats.rankInfo.currentRank}
              </span>
            )}
          </div>
          
          {!isLoading.uploadStats && uploadStats.rankInfo.nextRank && (
            <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
              Upload {uploadStats.rankInfo.uploadsNeeded} more approved questions to become a {uploadStats.rankInfo.nextRank}
            </p>
          )}
        </div>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards - UPDATED with upload stats */}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Tests Taken</h3>
                    {isLoading.history ? (
                      <div className="animate-pulse h-6 bg-gray-200 rounded mt-1 w-16"></div>
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold mt-1 text-blue-600">{stats.testsTaken}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Total tests completed</p>
              </div>
              
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Average Score</h3>
                    {isLoading.history ? (
                      <div className="animate-pulse h-6 bg-gray-200 rounded mt-1 w-16"></div>
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold mt-1 text-green-600">{stats.averageScore}%</p>
                    )}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Across all tests</p>
              </div>
              
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">Approved Uploads</h3>
                    {isLoading.uploadStats ? (
                      <div className="animate-pulse h-6 bg-gray-200 rounded mt-1 w-16"></div>
                    ) : (
                      <p className="text-2xl md:text-3xl font-bold mt-1 text-purple-600">
                        {uploadStats.approvedUploads}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-500 mt-2">Questions approved</p>
              </div>
                <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                                <div className="flex items-center">
                                    <div className="bg-yellow-100 p-2 rounded-lg mr-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A.75.75 0 003 5.48v10.643a.75.75 0 00.853.736c2.43-.428 4.926-.94 7.394-1.52.394-.096.669.328.338.611-1.3.975-2.965 1.9-4.77 2.716a.75.75 0 00-.365.962l1.732 4.26a.75.75 0 001.445.194l1.974-4.267c.58.13 1.17.248 1.768.35.45.1.9.19 1.35.27V21a.75.75 0 001.5 0v-2.766c.45-.08.9-.17 1.35-.27.599-.102 1.188-.22 1.768-.35l1.974 4.267a.75.75 0 001.445-.194l1.732-4.26a.75.75 0 00-.365-.962c-1.805-.816-3.47-1.74-4.77-2.716-.331-.283-.056-.707.338-.611 2.468.58 4.964 1.092 7.394 1.52a.75.75 0 00.853-.736V5.48a.75.75 0 00-.834-.724c-2.39.42-4.866.94-7.343 1.528-.388.093-.654-.332-.326-.611a8.963 8.963 0 002.45-4.34.75.75 0 00-1.46-.348 7.508 7.508 0 01-2.066 3.644 7.52 7.52 0 01-3.644 2.066.75.75 0 00-.348 1.46c1.577.397 3.2.74 4.843 1.01z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-base md:text-lg font-semibold text-gray-700">Global Rank</h3>
                                        {isLoading.rank ? (
                                            <div className="animate-pulse h-6 bg-gray-200 rounded mt-1 w-16"></div>
                                        ) : userRank ? (
                                            <p className="text-2xl md:text-3xl font-bold mt-1 text-yellow-600">#{userRank}</p>
                                        ) : (
                                            <p className="text-2xl md:text-3xl font-bold mt-1 text-yellow-600">N/A</p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs md:text-sm text-gray-500 mt-2">Your position on leaderboard</p>
                            </div>
                        </div>
            
            {/* Charts and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Your Performance
                  </h2>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Last 10 tests
                  </div>
                </div>
                <div className="h-64 md:h-80">
                  {isLoading.history ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-gray-500">Loading performance data...</div>
                    </div>
                  ) : testHistory.length > 0 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
                      <p className="text-gray-500 text-center">No test data available</p>
                      <button
                        onClick={() => {
                          setActiveTab('createTest');
                          setShowTestForm(true);
                        }}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Take Your First Test
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Leaderboard
                  </h2>
                  <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Top Performers
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {isLoading.leaderboard ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  ) : leaderboard && leaderboard.length > 0 ? (
                    <div className="space-y-3">
                      {leaderboard
                        .slice(0, 5)
                        .map((user, index) => {
                          const scorePercentage = user.question_count > 0 
                            ? Math.round((user.score / user.question_count) * 100)
                            : 0;
                          
                          return (
                            <div 
                              key={user.id || index} 
                              className={`flex items-center p-3 rounded-lg ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' : 
                                index === 1 ? 'bg-gray-50' : 
                                index === 2 ? 'bg-orange-50' : 'bg-white'
                              }`}
                            >
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                                index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                index === 1 ? 'bg-gray-200 text-gray-800' : 
                                index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 truncate">
                                  {user.user?.username || 'Unknown'}
                                </h4>
                                <p className="text-xs text-gray-600 truncate">
                                  {user.course?.name || 'N/A'}
                                </p>
                              </div>
                              <div className="font-semibold text-blue-600">
                                {scorePercentage}%
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
                      <p className="text-gray-500 text-center">No leaderboard data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md mb-6 md:mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                  Quick Actions
                </h2>
                <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Get Started
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    setActiveTab('createTest');
                    setShowTestForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start New Test
                </button>
                
                <button 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center"
                  onClick={() => navigate('/create-group')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Group Test
                </button>
                
                <button 
                  onClick={() => setActiveTab('petromark')}
                  className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  PetroMark AI
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Test Form */}
        {activeTab === 'createTest' && (
          <div className="bg-white p-5 md:p-8 rounded-xl shadow-md max-w-3xl mx-auto mb-8">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-full inline-block mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-blue-700">
                Create New Test
              </h2>
              <p className="text-gray-600 mt-2">
                Configure your test settings to get started
              </p>
            </div>
            
            {showTestForm ? (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                    Course
                  </label>
                  {isLoading.courses ? (
                    <div className="animate-pulse h-10 bg-gray-200 rounded-lg"></div>
                  ) : (
                    <select
                      value={selectedCourse}
                      onChange={e => setSelectedCourse(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      value={questionCount}
                      onChange={e => setQuestionCount(+e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={testDuration / 60}
                      onChange={e => setTestDuration(+e.target.value * 60)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleStartTest}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Begin Test
                </button>
              </div>
            ) : (
              <div className="text-center py-6 md:py-10">
                <button
                  onClick={() => setShowTestForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition"
                >
                  Configure Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* PetroMark AI Tab */}
        {activeTab === 'petromark' && (
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6 h-[calc(100vh-200px)]">
            <div className="flex items-center mb-4 md:mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 md:p-3 rounded-full mr-3 md:mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">PetroMark AI Assistant</h2>
                <p className="text-gray-600 text-sm md:text-base">Your intelligent learning companion</p>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden h-[calc(100%-80px)]">
              <PetroMarkAI />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                Test History
              </h2>
              <div className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                Recent Tests
              </div>
            </div>
            {isLoading.history ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : testHistory.length > 0 ? (
              <div className="space-y-3">
                {testHistory.map(session => {
                  const start = new Date(session.start_time);
                  const end = new Date(session.end_time);
                  const duration = Math.round((end - start) / 60000);
                  const scorePercentage = (session.questions && session.questions.count > 0)
                    ? Math.round((session.score / session.questions.count) * 100)
                    : 0;

                  return (
                    <div key={session.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">
                          {session.course.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          scorePercentage >= 80 ? 'bg-green-100 text-green-800' :
                          scorePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {scorePercentage}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {end.toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {duration} min
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Score:</span> {session.score}/{session.questions?.count || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
                <div className="text-gray-500 mb-4">No test history available</div>
                <button
                  onClick={() => {
                    setActiveTab('createTest');
                    setShowTestForm(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg"
                >
                  Take Your First Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-md max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold mb-4 md:mb-6 text-gray-800">
              Account Settings
            </h2>
            
            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2 md:mb-3">
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm md:text-base font-medium text-gray-700 mb-1">
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
                <h3 className="text-base md:text-lg font-medium text-gray-800 mb-2 md:mb-3">
                  Notification Preferences
                </h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label className="ml-2 text-sm md:text-base text-gray-700">
                      Email notifications
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <label className="ml-2 text-sm md:text-base text-gray-700">
                      Push notifications
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Component - Only shown on dashboard */}
        {activeTab === 'dashboard' && (
          <div className="mt-6 md:mt-10 max-w-4xl mx-auto">
            <Chat />
          </div>
        )}
      </div>
    </div>
  );
}