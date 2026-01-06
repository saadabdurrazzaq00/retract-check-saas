import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './DataImport.css';

// --- CONFIGURATION ---
const VALID_IDENTIFIERS = [
  'TITLE', 'ARTICLE TITLE', 'SOURCE TITLE',
  'DOI', 'DOI LINK', 'LINK',
  'PUBMEDID', 'PMID', 'PUBMED_ID', 'PUBMED ID'
];

const DataImport = ({ onFileUpload }) => { 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Validate Headers
  const validateHeaders = (headers) => {
    const cleanHeaders = headers.map(h => h ? h.toString().toUpperCase().trim() : "");
    return cleanHeaders.some(header => VALID_IDENTIFIERS.includes(header));
  };

  const processFile = (file) => {
    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = e.target.result;
        let finalData = [];

        try {
          // --- CSV HANDLING (Single Sheet by definition) ---
          if (file.name.toLowerCase().endsWith('.csv')) {
            const result = Papa.parse(data, { header: false, skipEmptyLines: true });
            finalData = result.data;
          } 
          // --- EXCEL HANDLING (Multi-Sheet Logic) ---
          else {
            const workbook = XLSX.read(data, { type: 'binary' });
            
            // 1. Gather ALL records from ALL sheets
            let allRecords = [];
            workbook.SheetNames.forEach(sheetName => {
              const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
              allRecords = allRecords.concat(sheetData);
            });

            if (allRecords.length > 0) {
              // 2. Find ALL unique headers (Superset of columns)
              // This handles cases where Sheet 1 has "DOI" and Sheet 2 has "PMID"
              const uniqueHeaders = new Set();
              allRecords.forEach(row => {
                Object.keys(row).forEach(key => uniqueHeaders.add(key));
              });
              
              const headerRow = Array.from(uniqueHeaders);

              // 3. Map records to arrays based on the master header row
              const bodyRows = allRecords.map(record => {
                return headerRow.map(header => record[header] || ""); // Fill missing cols with empty string
              });

              // 4. Combine Header + Body
              finalData = [headerRow, ...bodyRows];
            }
          }

          // --- VALIDATION & COMPLETION ---
          if (finalData.length > 0) {
            const headers = finalData[0];
            const isValid = validateHeaders(headers);
            
            if (!isValid) {
              setError(`Missing valid columns! Sheets must contain at least one of: "DOI", "PMID", or "TITLE"`);
              setIsProcessing(false);
              return;
            }

            setIsProcessing(false);
            setIsSuccess(true);
            
            setTimeout(() => {
                onFileUpload(finalData); 
            }, 1000);

          } else {
            setError("The file appears to be empty.");
            setIsProcessing(false);
          }
        } catch (err) {
          console.error(err);
          setError("Failed to parse file. Ensure it is a valid CSV or Excel file.");
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
        
        {isProcessing && (
          <div className="loading-state">
            <div className="spinner-wrapper"><Loader2 className="spinner" size={48} /></div>
            <h3>Scanning Workbook...</h3>
            <p>Merging sheets and validating headers</p>
          </div>
        )}

        {isSuccess && (
          <div className="loading-state success-state">
             <div className="icon-circle green"><CheckCircle size={48} /></div>
             <h3>Upload Successful!</h3>
             <p>Redirecting to dashboard...</p>
          </div>
        )}

        {!isProcessing && !isSuccess && (
          <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''} ${error ? 'error-border' : ''}`}>
            <input {...getInputProps()} />
            <div className="icon-circle">
              {isDragActive ? <FileSpreadsheet size={32} className="icon-active" /> : <UploadCloud size={32} className="icon-default" />}
            </div>
            <h2>Data Import</h2>
            <p className="main-text">{isDragActive ? "Drop it like it's hot!" : "Upload your dataset to begin"}</p>
            <button className="upload-btn">Click to upload</button>
            <p className="sub-text">Supports .XLSX (Multiple Sheets) or .CSV</p>

            <div className="format-guide">
               <Info size={14} className="info-icon"/>
               <div className="guide-text">
                  <strong>Accepted Columns (Case Insensitive):</strong>
                  <ul>
                      <li><code>DOI</code> or <code>DOI Link</code></li>
                      <li><code>PMID</code> or <code>PUBMEDID</code></li>
                      <li><code>TITLE</code> or <code>Article Title</code></li>
                  </ul>
                  <span>(Scans all sheets for these columns)</span>
               </div>
            </div>
          </div>
        )}

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
