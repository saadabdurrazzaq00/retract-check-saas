import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthForm from './components/AuthForm';
import DataImport from './components/DataImport';
import DataPreview from './components/DataPreview';
import './App.css';

function App() {
  // appState manages which screen is visible:
  // 'landing' -> 'auth' -> 'upload' -> 'preview'
  const [appState, setAppState] = useState('landing');
  const [parsedData, setParsedData] = useState(null);

  // 1. User clicks "Start Free Audit" on Landing Page
  const handleStart = () => {
    setAppState('auth');
  };

  // 2. User successfully enters the Invitation Code
  const handleLoginSuccess = () => {
    setAppState('upload');
  };

  // 3. User clicks "Cancel" on the Auth screen
  const handleBackToLanding = () => {
    setAppState('landing');
  };

  // 4. User uploads a valid file
  const handleFileUpload = (data) => {
    setParsedData(data);
    setAppState('preview');
  };

  // 5. User clicks "New Search" on the Results screen
  const handleBackToUpload = () => {
    setParsedData(null);
    setAppState('upload');
  };

  return (
    <div className="App">
      <main className="main-content">
        
        {/* SCREEN 1: LANDING PAGE */}
        {appState === 'landing' && (
           <LandingPage onStart={handleStart} />
        )}

        {/* SCREEN 2: AUTHENTICATION (Gatekeeper) */}
        {appState === 'auth' && (
           <AuthForm 
             onLoginSuccess={handleLoginSuccess} 
             onBack={handleBackToLanding} 
           />
        )}

        {/* SCREEN 3: DATA IMPORT (Upload) */}
        {appState === 'upload' && (
           <DataImport onFileUpload={handleFileUpload} />
        )}

        {/* SCREEN 4: PREVIEW & RESULTS DASHBOARD */}
        {appState === 'preview' && (
           <DataPreview 
             data={parsedData} 
             onBack={handleBackToUpload} 
           />
        )}

      </main>
    </div>
  );
}

export default App;
