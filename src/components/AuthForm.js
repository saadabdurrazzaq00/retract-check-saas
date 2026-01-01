import React, { useState } from 'react';
import { KeyRound, ArrowRight, AlertCircle, Lock } from 'lucide-react';
import './AuthForm.css';
import validCodes from '../creds.json'; // Imports the array of codes

const AuthForm = ({ onLoginSuccess, onBack }) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for a professional feel
    setTimeout(() => {
      // Check if the entered code exists in our JSON list
      // .trim() removes accidental spaces at the start/end
      const isValid = validCodes.includes(accessCode.trim());

      if (isValid) {
        onLoginSuccess();
      } else {
        setError("Invalid invitation code.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="auth-header">
           <div className="icon-circle-auth">
              <KeyRound size={32} />
           </div>
           <h2>Enter Access Code</h2>
           <p>This tool is currently private. Please enter your invitation code to proceed.</p>
        </div>

        <form onSubmit={handleLogin}>
           <div className="input-group">
              <label><Lock size={14}/> Invitation Code</label>
              <input 
                type="text" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter Access Code Here" 
                required 
                autoFocus
              />
           </div>

           {error && (
             <div className="error-message">
               <AlertCircle size={16} /> {error}
             </div>
           )}

           <button type="submit" className="login-btn" disabled={isLoading}>
             {isLoading ? "Verifying..." : <>Unlock Dashboard <ArrowRight size={16}/></>}
           </button>
        </form>

        <button className="back-link" onClick={onBack}>Cancel and go back</button>
      </div>
    </div>
  );
};

export default AuthForm;
