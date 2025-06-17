import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadPassQuestions = () => {
  const [questionType, setQuestionType] = useState('multichoice');
  const [file, setFile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [uploadStatus, setUploadStatus] = useState(null);
  const navigate = useNavigate();

  // Fetch available courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/courses/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        setCourses(response.data);
      } catch (error) {
        setMessage({ text: 'Failed to load courses', type: 'error' });
      }
    };
    fetchCourses();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ text: 'Invalid file type. Please upload PDF, DOCX, or TXT.', type: 'error' });
        return;
      }
      setFile(selectedFile);
      setMessage({ text: '', type: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!file) {
      setMessage({ text: 'Please select a file', type: 'error' });
      return;
    }
    if (!selectedCourse) {
      setMessage({ text: 'Please select a course', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_id', selectedCourse);
    formData.append('question_type', questionType);

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/upload-pass-questions/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      setMessage({ 
        text: response.data.message || 'Upload successful! Your questions are pending admin approval.',
        type: 'success'
      });
      setUploadStatus({
        count: response.data.count || 0,
        course: response.data.course,
        filename: file.name
      });
      
      // Reset form after successful upload
      setFile(null);
      document.querySelector('input[type="file"]').value = '';
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      'Upload failed. Please try again.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 p-2 bg-gray-200 rounded hover:bg-gray-300 transition"
      >
        &larr; Back to Dashboard
      </button>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Past Questions</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Question Type</h2>
          <div className="flex space-x-4">
            <button 
              className={`px-6 py-3 rounded-lg transition ${
                questionType === 'multichoice' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onClick={() => setQuestionType('multichoice')}
            >
              Multiple Choice
            </button>
            <button 
              className={`px-6 py-3 rounded-lg transition ${
                questionType === 'theory' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 opacity-50 cursor-not-allowed'
              }`}
              onClick={() => {
                setMessage({ 
                  text: 'Theory questions coming soon!', 
                  type: 'info' 
                });
              }}
              disabled
            >
              Theory Questions
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Currently only multiple choice questions are supported
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Select a course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload File
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex-1">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition ${
                  file ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    required
                  />
                  <p className="text-gray-600">
                    {file ? (
                      <span className="font-medium text-green-700">{file.name}</span>
                    ) : (
                      'Click to browse or drag and drop'
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOCX, TXT
                  </p>
                </div>
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    document.querySelector('input[type="file"]').value = '';
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !file || !selectedCourse}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Upload Questions'
              )}
            </button>
          </div>
        </form>

        {/* Status messages */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-100 text-red-700' :
            message.type === 'success' ? 'bg-green-100 text-green-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Upload details (shown after successful upload) */}
        {uploadStatus && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Upload Details</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li><span className="font-medium">Course:</span> {uploadStatus.course}</li>
              <li><span className="font-medium">File:</span> {uploadStatus.filename}</li>
              <li><span className="font-medium">Questions:</span> {uploadStatus.count}</li>
              <li><span className="font-medium">Status:</span> <span className="text-yellow-600">Pending Admin Approval</span></li>
            </ul>
            <p className="mt-3 text-sm text-gray-500">
              You can track the approval status in your dashboard.
            </p>
          </div>
        )}
      </div>

      {/* Help section */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How to format your file</h3>
        <p className="text-sm text-blue-700 mb-2">
          For best results, structure your questions like this:
        </p>
        <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
          {`1. What is 2+2?
a) 3
b) 4
c) 5
d) 6
Answer: b

2. Capital of France?
a) London
b) Berlin
c) Paris
d) Madrid
Answer: c`}
        </pre>
      </div>
    </div>
  );
};

export default UploadPassQuestions;