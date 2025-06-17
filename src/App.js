import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/SignIn';
import SignUp from './components/Signup';
import Dashboard from './components/Dashboard'; // Ensure this is correct
import Test from './components/Test';
import CreateGroupTest from './components/CreateGroupTest';
// import History from './components/History';
import GroupTestPage from './components/GroupTestPage';
import PrivateRoute from './Layouts/PrivateRoute';
import LandingPage from './components/LandingPage';
import MaterialsManagement from './components/MaterialsManagement';
import UploadPassQuestions from './components/UploadPassQuestion';

function App() {

  return (
    <Router>
      <Routes>
        <Route path='/signin' element={<SignIn />} />
        <Route path='/signup' element={<SignUp />} />
        <Route path='/' element={<LandingPage />} />
        
        <Route element={<PrivateRoute />}>
          {/* <Route path='/history' element={<History />} /> */}
           <Route path='/material' element={<MaterialsManagement />} />
          <Route path='/dashboard' element={ <Dashboard />} />
          <Route path='/test/:sessionId' element={<Test />} />
          <Route path='/create-group' element={<CreateGroupTest />} />
         
          
          <Route
            path="/group-test/:testId"
            element={<GroupTestPage />}
          />
          <Route path='/upload' element={<UploadPassQuestions />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;