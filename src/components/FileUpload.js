// THIS IS REPLACE BY THE DATAIMPOSRT.JS FOR BETTER UI AND ANIMATIONS. IF SOME LOGIC CRASHES THERE THIS IS THE ROBUST CODE YOU MAY SEE THIS



// ----------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------------------------------------



// import React, { useState, useCallback } from 'react';
// import * as XLSX from 'xlsx';
// import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
// import './FileUpload.css'; // We will create this next

// const REQUIRED_COLUMNS = ['UT', 'TITLE', 'DOI', 'AU', 'PY'];

// const FileUpload = (props) => {
//   const [dragActive, setDragActive] = useState(false);
//   const [status, setStatus] = useState('idle'); // idle, loading, success, error
//   const [message, setMessage] = useState('');
//   const [fileName, setFileName] = useState('');

//   const handleDrag = useCallback((e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setDragActive(true);
//     } else if (e.type === "dragleave") {
//       setDragActive(false);
//     }
//   }, []);

//   const validateFile = (file) => {
//     // 1. Validate Extension
//     const validExtensions = ['xlsx', 'xls', 'csv'];
//     const extension = file.name.split('.').pop().toLowerCase();
    
//     if (!validExtensions.includes(extension)) {
//       setStatus('error');
//       setMessage('Invalid format. Please upload a .csv or .xlsx file.');
//       return;
//     }

//     setStatus('loading');
//     setFileName(file.name);

//     // 2. Read File & Validate Columns
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: 'array' });
//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];
        
//         // Convert sheet to JSON to get headers (array of arrays)
//         const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
//         if (jsonData.length === 0) {
//           throw new Error("File is empty");
//         }

//         const headers = jsonData[0].map(h => h.toString().toUpperCase().trim());
        
//         // Check for missing columns
//         const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

//         if (missing.length > 0) {
//             setStatus('error');
//             setMessage(`Missing columns: ${missing.join(', ')}. Please re-enter a correct file.`);
//         } else {
//             setStatus('success');
//             setMessage('Input file success');
            
//             // ADD THIS LINE BELOW:
//             // Wait 1 second so the user sees the green checkmark, then switch screens
//             setTimeout(() => {
//                 // We assume 'onDataLoaded' is passed as a prop
//                 props.onDataLoaded(jsonData); 
//             }, 1000);
//         }
//       } catch (err) {
//         setStatus('error');
//         setMessage('Error reading file. Please try again.');
//       }
//     };
//     reader.readAsArrayBuffer(file);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setDragActive(false);
//     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
//       validateFile(e.dataTransfer.files[0]);
//     }
//   };

//   const handleChange = (e) => {
//     e.preventDefault();
//     if (e.target.files && e.target.files[0]) {
//       validateFile(e.target.files[0]);
//     }
//   };

//   const reset = () => {
//     setStatus('idle');
//     setMessage('');
//     setFileName('');
//   };

//   return (
//     <div className="saas-container">
//       <div className="upload-card">
//         <div className="card-header">
//           <h2>Data Import</h2>
//           <p>Upload your dataset to begin the scraping process.</p>
//         </div>

//         <div 
//           className={`drop-zone ${dragActive ? 'active' : ''} ${status === 'error' ? 'error-border' : ''}`}
//           onDragEnter={handleDrag} 
//           onDragLeave={handleDrag} 
//           onDragOver={handleDrag} 
//           onDrop={handleDrop}
//         >
//           <input 
//             type="file" 
//             id="file-upload" 
//             className="input-file" 
//             onChange={handleChange}
//             accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
//           />
          
//           <label htmlFor="file-upload" className="drop-label">
//             {status === 'idle' && (
//               <>
//                 <div className="icon-wrapper"><Upload size={32} /></div>
//                 <span className="bold-text">Click to upload</span> or drag and drop
//                 <span className="sub-text">.XLSX or .CSV (Required: UT, TITLE, DOI, AU, PY)</span>
//               </>
//             )}

//             {status === 'loading' && (
//                <div className="status-content">
//                  <div className="spinner"></div>
//                  <span>Validating {fileName}...</span>
//                </div>
//             )}

//             {status === 'success' && (
//               <div className="status-content success">
//                 <CheckCircle size={40} className="success-icon" />
//                 <span className="file-name">{fileName}</span>
//                 <span className="status-message">{message}</span>
//               </div>
//             )}

//             {status === 'error' && (
//               <div className="status-content error">
//                 <AlertCircle size={40} className="error-icon" />
//                 <span className="status-message">{message}</span>
//                 <button className="reset-btn" onClick={(e) => { e.preventDefault(); reset(); }}>Try Again</button>
//               </div>
//             )}
//           </label>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FileUpload;