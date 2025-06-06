import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard'; // Ensure this is correct
import Test from './components/Test';
import CreateGroupTest from './components/CreateGroupTest';
import History from './components/History';
import GroupTestPage from './components/GroupTestPage';

function App() {
  const token = localStorage.getItem('access_token');
  
  return (
    <Router>
      <Routes>
        <Route path='/' element={token ? <Navigate to='/dashboard'/> : <Navigate to='/signin'/>} />
        <Route path='/signin' element={<SignIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/dashboard' element={token ? <Dashboard /> : <Navigate to='/signin' />} />
        <Route path='/test/:sessionId' element={<Test />} />
        <Route path='/create-group' element={<CreateGroupTest />} />
        <Route path='/history' element={<History />} />
       <Route
          path="/group-test/:testId"
          element={token ? <GroupTestPage /> : <Navigate to="/signin" />}
        />
      </Routes>
    </Router>
  );
}

export default App;