import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './DataImport.css';

// We now define what columns are "Valid Identifiers"
const VALID_IDENTIFIERS = ['TITLE', 'DOI', 'PUBMEDID', 'PMID', 'PUBMED_ID'];

const DataImport = ({ onFileUpload }) => { 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Validate Headers
  const validateHeaders = (headers) => {
    // 1. Normalize file headers to uppercase/trimmed
    const cleanHeaders = headers.map(h => h ? h.toString().toUpperCase().trim() : "");
    
    // 2. Check if AT LEAST ONE valid identifier exists in the file
    // We look for an intersection between cleanHeaders and VALID_IDENTIFIERS
    const hasValidColumn = cleanHeaders.some(header => VALID_IDENTIFIERS.includes(header));
    
    return hasValidColumn;
  };

  const processFile = (file) => {
    setIsProcessing(true);
    setError(null);

    // 1.5s Animation Delay
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = e.target.result;
        let rows = [];

        try {
          if (file.name.toLowerCase().endsWith('.csv')) {
            const result = Papa.parse(data, { header: false, skipEmptyLines: true });
            rows = result.data;
          } else {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
          }

          if (rows.length > 0) {
            const headers = rows[0];
            
            // --- UPDATED VALIDATION LOGIC ---
            const isValid = validateHeaders(headers);
            
            if (!isValid) {
              setError(`Missing required columns! File must contain at least one of: "DOI", "PMID", or "TITLE"`);
              setIsProcessing(false);
              return;
            }

            // Success
            setIsProcessing(false);
            setIsSuccess(true);
            
            setTimeout(() => {
                onFileUpload(rows); 
            }, 1000);

          } else {
            setError("The file appears to be empty.");
            setIsProcessing(false);
          }
        } catch (err) {
          setError("Failed to parse file. Please try a different format.");
          setIsProcessing(false);
        }
      };

      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    }, 1500); 
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    disabled: isProcessing || isSuccess
  });

  return (
    <div className="import-container">
      <div className={`upload-card ${isProcessing ? 'processing' : ''}`}>
        
        {/* STATE 1: LOADING */}
        {isProcessing && (
          <div className="loading-state">
            <div className="spinner-wrapper">
              <Loader2 className="spinner" size={48} />
            </div>
            <h3>Analyzing Dataset...</h3>
            <p>Validating schema and preparing preview</p>
          </div>
        )}

        {/* STATE 2: SUCCESS */}
        {isSuccess && (
          <div className="loading-state success-state">
             <div className="icon-circle green">
               <CheckCircle size={48} />
             </div>
             <h3>Upload Successful!</h3>
             <p>Redirecting to dashboard...</p>
          </div>
        )}

        {/* STATE 3: UPLOAD UI */}
        {!isProcessing && !isSuccess && (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${error ? 'error-border' : ''}`}>
            <input {...getInputProps()} />
            
            <div className="icon-circle">
              {isDragActive ? (
                <FileSpreadsheet size={32} className="icon-active" />
              ) : (
                <UploadCloud size={32} className="icon-default" />
              )}
            </div>

            <h2>Data Import</h2>
            <p className="main-text">
              {isDragActive ? "Drop it like it's hot!" : "Upload your dataset to begin"}
            </p>
            
            <button className="upload-btn">Click to upload</button>
            
            <p className="sub-text">
              Supports .XLSX or .CSV files
            </p>

            {/* --- NEW FORMAT GUIDE SECTION --- */}
            <div className="format-guide">
               <Info size={14} className="info-icon"/>
               <div className="guide-text">
                  <strong>Required Columns (Case Insensitive):</strong>
                  <ul>
                      <li><code>DOI</code> or <code>DOI Link</code></li>
                      <li><code>PMID</code> or <code>PUBMEDID</code></li>
                      <li><code>TITLE</code> or <code>Article Title</code></li>
                  </ul>
                  <span>(You only need at least one to proceed)</span>
               </div>
            </div>
            {/* -------------------------------- */}

          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="error-toast">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

      </div>
    </div>
  );
};

export default DataImport;
