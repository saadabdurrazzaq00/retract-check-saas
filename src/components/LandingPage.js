import React from 'react';
import { 
  CheckCircle, ShieldAlert, Zap, Search, 
  ArrowRight, Database, TrendingUp, Users 
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-container">
      
      {/* --- HERO SECTION --- */}
      <header className="hero-section">
        <nav className="navbar">
          <div className="logo">
            <ShieldAlert className="logo-icon" size={28} />
            <span>RetractCheck<span className="dot">.io</span></span>
          </div>
          <button className="nav-cta" onClick={onStart}>Get Started</button>
        </nav>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span> New: Direct Crossref Database Integration
          </div>
          <h1>
            Stop Citing <span className="highlight">Retracted Science.</span> <br/>
            Audit Your Research in Seconds.
          </h1>
          <p className="hero-sub">
            The world's first automated bulk-auditor for academic citations. 
            Instantly cross-reference thousands of DOIs against the official Retraction Watch database.
            Protect your reputation before you publish.
          </p>
          
          <div className="cta-group">
            <button className="primary-cta" onClick={onStart}>
              Start Free Audit <ArrowRight size={18} />
            </button>
            <div className="hero-trust">
              <div className="avatars">
                {/* Simple CSS circles to simulate avatars */}
                <div className="avatar" style={{background: '#cbd5e1'}}></div>
                <div className="avatar" style={{background: '#94a3b8'}}></div>
                <div className="avatar" style={{background: '#64748b'}}></div>
              </div>
              <span>Trusted by 400+ Researchers</span>
            </div>
          </div>
        </div>

        {/* Hero Visual / Abstract UI */}
        <div className="hero-visual">
          <div className="glass-card">
            <div className="glass-header">
               <div className="dots"><span/><span/><span/></div>
               <div className="glass-title">Audit_Report_2024.csv</div>
            </div>
            <div className="glass-body">
               <div className="glass-row clean">
                  <CheckCircle size={16} color="#10b981"/> 10.1038/s41586-023-0001
                  <span className="badge-clean">Clean</span>
               </div>
               <div className="glass-row danger">
                  <ShieldAlert size={16} color="#ef4444"/> 10.1016/j.univ.2021.04
                  <span className="badge-danger">Retracted</span>
               </div>
               <div className="glass-row clean">
                  <CheckCircle size={16} color="#10b981"/> 10.1126/science.ade
                  <span className="badge-clean">Clean</span>
               </div>
            </div>
            <div className="scan-line"></div>
          </div>
        </div>
      </header>


      {/* --- VALUE PROPOSITION --- */}
      <section className="value-props">
        <div className="section-header">
           <h2>Why risk your credibility?</h2>
           <p>Manual checking is impossible. We made it instant.</p>
        </div>
        
        <div className="grid-3">
           <div className="feature-card">
              <div className="icon-box blue"><Zap size={24}/></div>
              <h3>Lightning Fast</h3>
              <p>Process 5,000+ DOIs in under 30 seconds. Our local-first engine creates a hash map of the entire database instantly.</p>
           </div>
           <div className="feature-card">
              <div className="icon-box purple"><Database size={24}/></div>
              <h3>Official Data Source</h3>
              <p>Powered by the Crossref & Retraction Watch acquisition. We don't scrape; we query the authoritative source of truth.</p>
           </div>
           <div className="feature-card">
              <div className="icon-box green"><ShieldAlert size={24}/></div>
              <h3>Privacy First</h3>
              <p>Your research data never leaves your browser. All processing happens client-side for maximum security.</p>
           </div>
        </div>
      </section>


      {/* --- HOW IT WORKS (Steps) --- */}
      <section className="how-it-works">
         <div className="steps-container">
            <div className="step-item">
               <div className="step-num">01</div>
               <h3>Upload List</h3>
               <p>Drag & drop your .CSV or .XLSX file containing a list of DOIs.</p>
            </div>
            <div className="connector"></div>
            <div className="step-item">
               <div className="step-num">02</div>
               <h3>Auto-Scan</h3>
               <p>Our engine checks every DOI against 45,000+ known retractions.</p>
            </div>
            <div className="connector"></div>
            <div className="step-item">
               <div className="step-num">03</div>
               <h3>Download Report</h3>
               <p>Get a clean CSV flagging any "dirty" citations with reasons.</p>
            </div>
         </div>
      </section>


      {/* --- USE CASES --- */}
      <section className="use-cases">
        <h2>Who is this for?</h2>
        <div className="cases-grid">
           <div className="case-card">
              <div className="case-icon"><Search/></div>
              <div>
                 <h4>Literature Reviews</h4>
                 <p>Screen thousands of papers for a systematic review in minutes, ensuring no retracted studies contaminate your meta-analysis.</p>
              </div>
           </div>
           <div className="case-card">
              <div className="case-icon"><TrendingUp/></div>
              <div>
                 <h4>Journal Editors</h4>
                 <p>Perform a final "sanity check" on incoming manuscripts before acceptance to catch cited retractions.</p>
              </div>
           </div>
           <div className="case-card">
              <div className="case-icon"><Users/></div>
              <div>
                 <h4>Lab Managers</h4>
                 <p>Audit your lab's past publications to ensure your team hasn't inadvertently built work on shaky foundations.</p>
              </div>
           </div>
        </div>
      </section>


      {/* --- FINAL CTA --- */}
      <footer className="footer-cta">
         <div className="cta-content">
            <h2>Ready to secure your research?</h2>
            <p>Join smart researchers who audit their work automatically.</p>
            <button className="primary-cta large" onClick={onStart}>
               Launch Dashboard Now
            </button>
         </div>
         <div className="footer-links">
            <span>© 2026 RetractCheck.io</span>
            <span>Created by Saad Abdur Razzaq</span>
         </div>
      </footer>

    </div>
  );
};

export default LandingPage;