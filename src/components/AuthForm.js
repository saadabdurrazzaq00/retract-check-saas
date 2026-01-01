import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import './AuthForm.css';

// --- CONFIGURATION ---
// You can add more users here if needed
const VALID_USERS = [
  { username: "admin", password: "password123" }, // CHANGE THIS!
  { username: "demo", password: "demo" }
];

const AuthForm = ({ onLoginSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay for realism (optional)
    setTimeout(() => {
      const isValid = VALID_USERS.find(
        u => u.username === username && u.password === password
      );

      if (isValid) {
        onLoginSuccess();
      } else {
        setError("Invalid credentials. Access denied.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card">
        <div className="auth-header">
           <div className="icon-circle-auth">
              <ShieldCheck size={32} />
           </div>
           <h2>Restricted Access</h2>
           <p>Enter authorized credentials to access the Audit Engine.</p>
        </div>

        <form onSubmit={handleLogin}>
           <div className="input-group">
              <label><User size={14}/> Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username" 
                required 
              />
           </div>

           <div className="input-group">
              <label><Lock size={14}/> Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required 
              />
           </div>

           {error && (
             <div className="error-message">
               <AlertCircle size={16} /> {error}
             </div>
           )}

           <button type="submit" className="login-btn" disabled={isLoading}>
             {isLoading ? "Verifying..." : <>Access Dashboard <ArrowRight size={16}/></>}
           </button>
        </form>

        <button className="back-link" onClick={onBack}>Cancel and go back</button>
      </div>
    </div>
  );
};

export default AuthForm;
