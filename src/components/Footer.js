import React from 'react';
import { Linkedin, Phone, Code2 } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        
        {/* Left: Developer Profile */}
        <div className="footer-profile">
          <img 
            src="/assets/developer.jpg" 
            alt="Saad Abdur Razzaq" 
            className="dev-photo"
            onError={(e) => {e.target.style.display='none'}} // Hides if image not found
          />
          <div className="dev-info">
            <h4>Saad Abdur Razzaq</h4>
            <span className="dev-role"><Code2 size={12} /> Lead Developer</span>
          </div>
        </div>

        {/* Right: Contact Links */}
        <div className="footer-links">
          <a href="tel:+923036668942" className="footer-link">
            <Phone size={14} /> <span>+92 303 666 8942</span>
          </a>
          <div className="divider">|</div>
          <a 
            href="https://linkedin.com/in/saadarazzaq" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="footer-link"
          >
            <Linkedin size={14} /> <span>LinkedIn Profile</span>
          </a>
        </div>

      </div>
      
      <div className="footer-copyright">
        &copy; {new Date().getFullYear()} Retraction Audit Engine. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
