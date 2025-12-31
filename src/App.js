import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import DataImport from './components/DataImport';
import DataPreview from './components/DataPreview';
import './App.css';

function App() {
  const [appState, setAppState] = useState('landing'); // 'landing', 'upload', 'preview'
  const [parsedData, setParsedData] = useState(null);

  const handleStart = () => {
    setAppState('upload');
  };

  const handleFileUpload = (data) => {
    setParsedData(data);
    setAppState('preview');
  };

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

        {/* SCREEN 2: UPLOAD */}
        {appState === 'upload' && (
           <DataImport onFileUpload={handleFileUpload} />
        )}

        {/* SCREEN 3: PREVIEW & RESULTS */}
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