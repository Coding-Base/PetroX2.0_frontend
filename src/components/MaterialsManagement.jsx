// MaterialManagement.jsx
import React, { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';

export default function MaterialsManagement() {
  const [mode, setMode] = useState('upload');
  const [materialName, setMaterialName] = useState('');
  const [tags, setTags] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedMaterials, setUploadedMaterials] = useState([]);
  const [downloadedMaterials, setDownloadedMaterials] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get('http://127.0.0.1:8000/api/courses/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data);
      } catch (err) {
        console.error('Failed to load courses', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
    
    // Load previously downloaded materials from localStorage
    const savedDownloads = JSON.parse(localStorage.getItem('downloadedMaterials') || '[]');
    setDownloadedMaterials(savedDownloads);
  }, []);

  const handleUpload = async () => {
    if (!selectedCourseId || !materialName || !file) {
      alert('Please fill all required fields');
      return;
    }

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('course', selectedCourseId);
    formData.append('name', materialName);
    formData.append('tags', tags);
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/materials/upload/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadedMaterials([data, ...uploadedMaterials]);
      
      // Reset form
      setMaterialName('');
      setTags('');
      setFile(null);
      setSelectedCourseId('');
      
      alert('Material uploaded successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to upload material');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      alert('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/materials/search/?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data);
      setMode('search-results');
      setShowMobileMenu(false); // Close mobile menu after search
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to search materials');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async (material) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/materials/download/${material.id}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();
      
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Add to downloaded materials
      const newDownloaded = [material, ...downloadedMaterials];
      setDownloadedMaterials(newDownloaded);
      
      // Save to localStorage
      localStorage.setItem('downloadedMaterials', JSON.stringify(newDownloaded));
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  // File icon based on file type
  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const iconClasses = "h-10 w-10 p-1.5 rounded-lg md:h-12 md:w-12 md:p-2 md:rounded-xl";
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return (
        <div className={`${iconClasses} bg-blue-100 text-blue-600`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
    } else if (['pdf'].includes(ext)) {
      return (
        <div className={`${iconClasses} bg-red-100 text-red-600`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    } else if (['doc', 'docx'].includes(ext)) {
      return (
        <div className={`${iconClasses} bg-blue-100 text-blue-600`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className={`${iconClasses} bg-gray-100 text-gray-600`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    }
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
  };

  return (
    <div className="w-full min-h-screen p-4 bg-gradient-to-br from-indigo-50 to-purple-50 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile menu button */}
        <div className="md:hidden flex justify-between items-center mb-4">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-lg bg-indigo-600 text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-indigo-900">Study Materials</h1>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
          <div className="hidden md:block">
            <h1 className="text-2xl md:text-3xl font-bold text-indigo-900">Study Materials</h1>
            <p className="text-indigo-600 hidden md:block">Upload, search, and access learning resources</p>
          </div>
          
          <div className="w-full flex flex-col md:flex-row items-center gap-3 md:gap-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 md:py-3 border border-indigo-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                placeholder="Search materials..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg 
                className="absolute left-3 top-2.5 md:top-3.5 h-4 w-4 md:h-5 md:w-5 text-indigo-400" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg md:rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin mr-2 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : 'Search'}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {showMobileMenu && (
          <div className="md:hidden mb-6 bg-white rounded-xl shadow-lg p-4">
            <button
              onClick={() => { setMode('upload'); setShowMobileMenu(false); }}
              className={`w-full mb-2 px-4 py-3 rounded-lg font-medium text-center ${
                mode === 'upload' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow'
              }`}
            >
              Upload Material
            </button>
            <button
              onClick={() => { setMode('download'); setShowMobileMenu(false); }}
              className={`w-full mb-2 px-4 py-3 rounded-lg font-medium text-center ${
                mode === 'download' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow'
              }`}
            >
              My Materials
            </button>
            <button
              onClick={() => { setMode('search-results'); setShowMobileMenu(false); }}
              className={`w-full px-4 py-3 rounded-lg font-medium text-center ${
                mode === 'search-results' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow'
              }`}
            >
              Search Results
            </button>
          </div>
        )}

        {/* Desktop mode buttons */}
        <div className="hidden md:flex space-x-2 md:space-x-4 mb-6 md:mb-8">
          <button
            onClick={() => setMode('upload')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
              mode === 'upload' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow'
            }`}
          >
            Upload Material
          </button>
          <button
            onClick={() => setMode('download')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
              mode === 'download' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow'
            }`}
          >
            My Materials
          </button>
          <button
            onClick={() => setMode('search-results')}
            className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition-all text-sm md:text-base ${
              mode === 'search-results' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' 
                : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow'
            }`}
          >
            Search Results
          </button>
        </div>

        {mode === 'upload' && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-5 md:p-8 mb-6 md:mb-8 border border-indigo-100">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-800 mb-4 md:mb-6 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload New Material
            </h2>
            
            <div className="grid grid-cols-1 gap-4 md:gap-6 mb-4 md:mb-6">
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-1 md:mb-2">
                  Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-indigo-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                >
                  <option value="">Select a course</option>
                  {courses?.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-1 md:mb-2">
                  Material Name
                </label>
                <input
                  type="text"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-indigo-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="Enter material name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-1 md:mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-indigo-200 rounded-lg md:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  placeholder="e.g., math, calculus, formulas"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-indigo-700 mb-1 md:mb-2">
                  File
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-indigo-300 border-dashed rounded-lg md:rounded-2xl cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition-colors">
                    <div className="flex flex-col items-center justify-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-indigo-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-xs md:text-sm text-indigo-600 font-medium text-center">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-indigo-400 mt-1">
                        Max file size: 10MB
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => setFile(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full md:w-auto px-4 py-2 md:px-8 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg md:rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 flex items-center justify-center shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin mr-2 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload Material
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {(mode === 'download' || mode === 'search-results') && (
          <div className="bg-white rounded-xl md:rounded-2xl shadow-lg md:shadow-xl p-4 md:p-6 border border-indigo-100">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-800 mb-4 md:mb-6 flex items-center gap-2">
              {mode === 'search-results' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Results
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  My Materials
                </>
              )}
            </h2>
            
            {mode === 'download' && downloadedMaterials.length === 0 && (
              <div className="text-center py-8 md:py-16 rounded-lg md:rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 md:h-24 md:w-24 mx-auto text-indigo-300 mb-3 md:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg md:text-xl font-medium text-indigo-700 mb-2">No materials yet</h3>
                <p className="text-indigo-500 mb-4 text-sm md:text-base">Download materials to see them here</p>
                <button
                  onClick={() => setMode('search-results')}
                  className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg md:rounded-xl hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
                >
                  Search Materials
                </button>
              </div>
            )}
            
            {(mode === 'search-results' || downloadedMaterials.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {(mode === 'search-results' ? searchResults : downloadedMaterials).map((material) => (
                  <div 
                    key={material.id} 
                    className="border border-indigo-100 rounded-lg md:rounded-2xl overflow-hidden hover:shadow-md md:hover:shadow-lg transition-all bg-white flex flex-col"
                  >
                    <div className="p-3 md:p-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex justify-center">
                      {getFileIcon(material.name)}
                    </div>
                    <div className="p-3 md:p-4 flex-grow">
                      <h4 className="font-bold text-gray-800 mb-1 truncate text-sm md:text-base" title={material.name}>
                        {material.name}
                      </h4>
                      <div className="flex items-start gap-2 text-xs md:text-sm text-indigo-600 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="truncate">{getCourseName(material.course)}</span>
                      </div>
                      {material.tags && (
                        <div className="flex flex-wrap gap-1 mb-2 md:mb-3">
                          {material.tags.split(',').map((tag, index) => (
                            <span key={index} className="px-1.5 py-0.5 md:px-2 md:py-1 bg-indigo-100 text-indigo-700 text-[10px] md:text-xs rounded-full">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1 md:mt-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 md:h-3 md:w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(material.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="px-3 pb-3 md:px-4 md:pb-4">
                      <button
                        onClick={() => handleDownload(material)}
                        className="w-full flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all text-sm md:text-base"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}