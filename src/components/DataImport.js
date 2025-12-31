import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { UploadCloud, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import './DataImport.css';

// The strict columns you require
const REQUIRED_COLUMNS = ['UT', 'TITLE', 'DOI', 'AU', 'PY'];

const DataImport = ({ onFileUpload }) => { // Assuming parent passes 'onFileUpload'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Helper: Validate Headers
  const validateHeaders = (headers) => {
    const cleanHeaders = headers.map(h => h.toString().toUpperCase().trim());
    const missing = REQUIRED_COLUMNS.filter(col => !cleanHeaders.includes(col));
    return missing;
  };

  const processFile = (file) => {
    setIsProcessing(true);
    setError(null);

    // 1.5s Artificial Delay for the "Premium Loading" feel
    setTimeout(() => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = e.target.result;
        let rows = [];

        try {
          // Parse CSV or Excel
          if (file.name.toLowerCase().endsWith('.csv')) {
            const result = Papa.parse(data, { header: false, skipEmptyLines: true });
            rows = result.data;
          } else {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
          }

          // Validation
          if (rows.length > 0) {
            const headers = rows[0];
            const missing = validateHeaders(headers);
            
            if (missing.length > 0) {
              setError(`Missing columns: ${missing.join(', ')}`);
              setIsProcessing(false);
              return;
            }

            // Success State
            setIsProcessing(false);
            setIsSuccess(true);
            
            // Wait 1s more to show the "Success Green Check" before navigating
            setTimeout(() => {
               onFileUpload(rows); // Send data to parent
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

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, []);

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

        {/* STATE 3: UPLOAD UI (Default) */}
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
              or drag and drop .XLSX or .CSV <br/>
              <span className="req-text">(Required: UT, TITLE, DOI, AU, PY)</span>
            </p>
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