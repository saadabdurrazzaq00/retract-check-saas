import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Play, ArrowLeft, FileText, Layout, 
  AlertTriangle, CheckCircle, TrendingUp, Users, 
  Download, Database, ShieldAlert, Copy, Activity, Info 
} from 'lucide-react';
import './DataPreview.css';

const DataPreview = ({ data, onBack }) => {
  const [viewState, setViewState] = useState('input'); // input | processing | results
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState(null);

  // --- 1. MEMOIZED INPUT STATS (Input View) ---
  const inputStats = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    const validData = data.filter(row => row && row.length > 0);
    if (validData.length === 0) return {};

    const headers = validData[0];
    const rows = validData.slice(1);
    
    // Helper to find column index case-insensitively
    const getIndex = (name) => headers.findIndex(h => h && h.toString().toUpperCase().trim() === name);
    
    const titleIndex = getIndex('TITLE');
    const doiIndex = getIndex('DOI');

    // Calculate DOI Coverage
    let doiCount = 0;
    if (doiIndex !== -1) {
        doiCount = rows.filter(r => r[doiIndex] && r[doiIndex].toString().trim().length > 5).length;
    }
    const totalRows = rows.length;
    const doiCoverage = totalRows > 0 ? Math.round((doiCount / totalRows) * 100) + '%' : '0%';

    // Calculate Duplicates
    let duplicateTitles = 0;
    if (titleIndex !== -1) {
      const titles = rows.map(r => r[titleIndex] ? r[titleIndex].toString().toLowerCase().trim() : "");
      duplicateTitles = titles.length - new Set(titles).size;
    }

    return { totalRows, totalCols: headers.length, doiCoverage, duplicateTitles, headers, rows };
  }, [data]);

  // --- 2. BIBLIOMETRIC HELPERS ---

  // Analyze the "Reason" text to determine severity
  const analyzeSeverity = (reason) => {
    if (!reason) return { label: "Unknown", color: "gray" };
    const lower = reason.toLowerCase();
    
    // High Severity: Fraud, Manipulation, Falsification
    if (lower.includes('falsification') || lower.includes('fabrication') || lower.includes('misconduct') || lower.includes('manipulation') || lower.includes('ethical')) {
      return { label: "High: Misconduct", color: "#dc2626" }; // Red
    }
    // Medium Severity: Error, Reliable? 
    if (lower.includes('error') || lower.includes('mistake') || lower.includes('data issue')) {
      return { label: "Medium: Error", color: "#f59e0b" }; // Orange
    }
    // Low Severity: Duplicate, Copyright
    if (lower.includes('duplicate') || lower.includes('copyright') || lower.includes('administrative')) {
      return { label: "Low: Procedural", color: "#2563eb" }; // Blue
    }
    return { label: "Review Required", color: "#4b5563" };
  };

  // Calculate years between publication and retraction
  const calculateLag = (pubDate, retDate) => {
    if (!pubDate || !retDate) return "N/A";
    try {
        const p = new Date(pubDate);
        const r = new Date(retDate);
        if (isNaN(p) || isNaN(r)) return "N/A";
        
        const diffTime = Math.abs(r - p);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const years = (diffDays / 365).toFixed(1);
        
        return `${years} Years`;
    } catch (e) { return "N/A"; }
  };

  // Helper to remove timestamps (e.g., "4/1/2010 0:00" -> "4/1/2010")
  const cleanDate = (dateStr) => {
    if (!dateStr) return "";
    return dateStr.split(' ')[0]; 
  };

  // --- 3. CORE AUTOMATION LOGIC ---
  const handleStart = async () => {
    setViewState('processing');
    setProgress(0);
    
    try {
      // Load the Retraction Watch Database
      const response = await fetch('/assets/retraction_watch.csv');
      if (!response.ok) throw new Error("Database file missing");
      const csvText = await response.text();

      // Fake progress bar animation
      const progressInterval = setInterval(() => {
        setProgress(old => (old > 90 ? old : old + Math.floor(Math.random() * 10)));
      }, 200);

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          clearInterval(progressInterval);
          setProgress(100);

          const referenceData = results.data;
          
          // --- BUILD 3 INDEXES FOR FAST LOOKUP ---
          const doiMap = new Map();
          const pmidMap = new Map();
          const titleMap = new Map();
          
          referenceData.forEach(item => {
            // 1. DOI Index (Primary)
            if (item.OriginalPaperDOI) {
              doiMap.set(item.OriginalPaperDOI.trim().toLowerCase(), item);
            }
            // 2. PubMedID Index (Secondary)
            if (item.OriginalPaperPubMedID) {
              pmidMap.set(item.OriginalPaperPubMedID.toString().trim(), item);
            }
            // 3. Title Index (Tertiary - Fallback)
            if (item.Title) {
              titleMap.set(item.Title.trim().toLowerCase(), item);
            }
          });

          // Helpers to read input file columns
          const inputHeaders = data[0].map(h => h ? h.toString().toUpperCase().trim() : "");
          const getVal = (row, colName) => {
            const index = inputHeaders.indexOf(colName);
            return index !== -1 && row[index] !== undefined ? row[index] : "";
          };

          // Define Final Output Headers
          const outputHeaders = [
            "TITLE", "InputDOI", "Input_Pubmed_ID",
            "RetractionStatus", "RiskSeverity", "RetractionLag", 
            "Subject", "Journal", "Publisher", "Country", "Author", 
            "URLS", "ArticleType", 
            "OriginalPaperDate", "RetractionDate", 
            "OriginalPaperDOI", "RetractionDOI", 
            "OriginalPaperPubMedID", "RetractionPubMedID", 
            "Reason", "Paywalled", "Notes"
          ];

          const outputRows = data.slice(1).map(row => {
            // Grab Input Values
            const rawDoi = getVal(row, "DOI");
            const rawPmid = getVal(row, "PUBMEDID");
            const rawTitle = getVal(row, "TITLE");

            // Normalize Inputs
            const cleanDoi = rawDoi ? rawDoi.toString().trim().toLowerCase() : "";
            const cleanPmid = rawPmid ? rawPmid.toString().trim() : "";
            const cleanTitle = rawTitle ? rawTitle.toString().trim().toLowerCase() : "";

            // --- WATERFALL MATCHING LOGIC ---
            let match = null;
            if (cleanDoi) match = doiMap.get(cleanDoi);           // Step 1: DOI
            if (!match && cleanPmid) match = pmidMap.get(cleanPmid); // Step 2: PMID
            if (!match && cleanTitle) match = titleMap.get(cleanTitle); // Step 3: Title

            // Default Empty State
            let status = "Clean"; // Default to Clean instead of long text
            let severity = { label: "-", color: "green" };
            let lag = "-";
            
            let m = { 
                Subject: "", Journal: "", Publisher: "", Country: "", 
                Author: "", URLS: "", ArticleType: "", 
                OriginalPaperDate: "", RetractionDate: "", 
                OriginalPaperDOI: "", RetractionDOI: "", 
                OriginalPaperPubMedID: "", RetractionPubMedID: "",
                Reason: "", Paywalled: "", Notes: "" 
            };

            if (match) {
              // Safety: Ensure it's not a self-match (unlikely but good practice)
              const retDOI = match.RetractionDOI ? match.RetractionDOI.trim().toLowerCase() : "";
              const origDOI = match.OriginalPaperDOI ? match.OriginalPaperDOI.trim().toLowerCase() : "";

              if (retDOI !== origDOI) {
                 status = "RETRACTED";
                 
                 // Calculate Metrics
                 severity = analyzeSeverity(match.Reason);
                 lag = calculateLag(match.OriginalPaperDate, match.RetractionDate);

                 // Populate Data
                 m = {
                    Subject: match.Subject || "", 
                    Journal: match.Journal || "", 
                    Publisher: match.Publisher || "",
                    Country: match.Country || "", 
                    Author: match.Author || "",
                    URLS: match.URLS || "", 
                    ArticleType: match.ArticleType || "",
                    
                    // Clean Dates
                    OriginalPaperDate: cleanDate(match.OriginalPaperDate),
                    RetractionDate: cleanDate(match.RetractionDate),
                    
                    OriginalPaperDOI: match.OriginalPaperDOI || "",
                    RetractionDOI: match.RetractionDOI || "",
                    OriginalPaperPubMedID: match.OriginalPaperPubMedID || "",
                    RetractionPubMedID: match.RetractionPubMedID || "",
                    
                    Reason: match.Reason || "", 
                    Paywalled: match.Paywalled || "",
                    Notes: match.Notes || ""
                 };
              }
            }

            // Return Data Object
            return {
              row: [
                rawTitle, rawDoi, rawPmid,
                status, severity.label, lag,
                m.Subject, m.Journal, m.Publisher, m.Country, m.Author, m.URLS, m.ArticleType,
                m.OriginalPaperDate, m.RetractionDate,
                m.OriginalPaperDOI, m.RetractionDOI,
                m.OriginalPaperPubMedID, m.RetractionPubMedID,
                m.Reason, m.Paywalled, m.Notes
              ],
              meta: { status, severity } // Meta for stats counting
            };
          });

          // --- STATS CALCULATION ---
          const rowsOnly = outputRows.map(r => r.row);
          const foundCount = outputRows.filter(r => r.meta.status === "RETRACTED").length;
          const misconductCount = outputRows.filter(r => r.meta.severity.label.includes("Misconduct")).length;

          // Duplicate Title Check in Output
          const titles = outputRows.map(r => r.row[0] ? r.row[0].toString().toLowerCase().trim() : "");
          const duplicateTitles = titles.length - new Set(titles).size;

          setProcessedData({
            headers: outputHeaders,
            rows: rowsOnly,
            foundCount,
            misconductCount,
            totalRows: rowsOnly.length,
            duplicateTitles
          });

          setTimeout(() => setViewState('results'), 800);
        }
      });
    } catch (error) {
      console.error(error);
      alert("Error loading database or processing file.");
      setViewState('input');
    }
  };

  const handleDownload = () => {
    if (!processedData) return;
    const csvContent = [
      processedData.headers.join(','),
      ...processedData.rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Bibliometric_Audit_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDER: PROCESSING VIEW ---
  if (viewState === 'processing') {
    return (
      <div className="processing-container">
        <div className="scanner-animation">
          <div className="scan-line"></div>
          <Database size={64} className="db-icon" />
        </div>
        <h2>Analyzing Bibliometrics</h2>
        <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="processing-status">Calculating retraction lag and severity scores...</p>
      </div>
    );
  }

  // --- RENDER: RESULTS VIEW ---
  if (viewState === 'results') {
    return (
      <div className="results-container">
        <div className="results-header">
           <div className="header-left">
              <div className="success-badge"><CheckCircle size={16} /> Analysis Complete</div>
              <h2>Audit Report</h2>
           </div>
           <div className="header-right">
              <button className="secondary-btn" onClick={() => setViewState('input')}><ArrowLeft size={16} /> New Search</button>
              <button className="download-btn" onClick={handleDownload}><Download size={16} /> Download Report</button>
           </div>
        </div>

        {/* STATS GRID */}
        <div className="results-stats-grid">
           <div className="stat-card group">
              <div className="icon-box blue"><FileText size={20} /></div>
              <div><h3>{processedData.totalRows}</h3><p>Papers Audited</p></div>
           </div>
           
           <div className={`stat-card group ${processedData.foundCount > 0 ? 'alert-card' : 'clean-card'}`}>
              <div className={`icon-box ${processedData.foundCount > 0 ? 'red' : 'green'}`}>
                <ShieldAlert size={20} />
              </div>
              <div>
                 <h3 style={{color: processedData.foundCount > 0 ? '#dc2626' : '#16a34a'}}>
                    {processedData.foundCount}
                 </h3>
                 <p>Retractions Found</p>
              </div>
           </div>

           <div className="stat-card group">
              <div className="icon-box orange"><Activity size={20} /></div>
              <div><h3>{processedData.misconductCount}</h3><p>Misconduct Cases</p></div>
              <div className="tooltip">Confirmed Fraud/Falsification.</div>
           </div>
        </div>

        {/* LEGEND SECTION */}
        <div className="legend-container">
           <div className="legend-title">
             <Info size={16} />
             <h4>Understanding Your Risk Score</h4>
           </div>
           <div className="legend-grid">
             <div className="legend-item">
               <span className="badge badge-red">High: Misconduct</span>
               <p><strong>Fraud & Unethical:</strong> Falsification, Fabrication, or Manipulation. Immediate removal recommended.</p>
             </div>
             <div className="legend-item">
               <span className="badge badge-orange">Medium: Error</span>
               <p><strong>Data Issues:</strong> Honest calculation errors or inconsistent data. Results likely invalid.</p>
             </div>
             <div className="legend-item">
               <span className="badge badge-blue">Low: Procedural</span>
               <p><strong>Admin Issues:</strong> Duplicate publication or Copyright issues. Content may still be valid.</p>
             </div>
             <div className="legend-item">
               <span className="metric-label">Retraction Lag</span>
               <p><strong>Time Gap:</strong> Years between Publication and Retraction. Longer lag = Higher risk.</p>
             </div>
           </div>
        </div>

        {/* RESULTS TABLE */}
        <div className="results-table-wrapper">
           <table className="results-table">
              <thead><tr>{processedData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody>
                 {processedData.rows.slice(0, 100).map((row, rIdx) => {
                    const isRetracted = row[2] === "RETRACTED";
                    return (
                        <tr key={rIdx} className={isRetracted ? "retracted-row" : "clean-row"}>
                            {row.map((cell, cIdx) => (
                                <td key={cIdx}>
                                    {/* Render Badge for Severity Column (Index 3) */}
                                    {cIdx === 3 && isRetracted ? (
                                        <span className={`badge ${cell.includes("High") ? "badge-red" : cell.includes("Medium") ? "badge-orange" : "badge-blue"}`}>
                                            {cell.split(':')[0]}
                                        </span>
                                    ) : cell}
                                </td>
                            ))}
                        </tr>
                    )
                 })}
              </tbody>
           </table>
           <div className="results-footer">Showing first 100 results. Download CSV for full report.</div>
        </div>
      </div>
    );
  }

  // --- RENDER: INPUT PREVIEW ---
  return (
    <div className="preview-container fade-in">
      <div className="preview-header">
        <button onClick={onBack} className="back-btn"><ArrowLeft size={18} /> Back</button>
        <h2>Input Overview</h2>
        <button className="start-btn" onClick={handleStart}><Play size={18} /> Run Analysis</button>
      </div>

      <div className="stats-grid">
         <div className="stat-card group">
            <div className="icon-box blue"><FileText size={20} /></div>
            <div><h3>{inputStats.totalRows || 0}</h3><p>Total Rows</p></div>
            <div className="tooltip">Total number of records uploaded.</div>
         </div>
         <div className="stat-card group">
            <div className="icon-box purple"><Layout size={20} /></div>
            <div><h3>{inputStats.totalCols || 0}</h3><p>Columns</p></div>
            <div className="tooltip">Number of data fields per record.</div>
         </div>
         <div className="stat-card group">
            <div className="icon-box teal"><CheckCircle size={20} /></div>
            <div><h3>{inputStats.doiCoverage || '0%'}</h3><p>DOI Coverage</p></div>
            <div className="tooltip">% of papers containing a valid DOI.</div>
         </div>
         <div className="stat-card group">
            <div className="icon-box red"><AlertTriangle size={20} /></div>
            <div><h3>{inputStats.duplicateTitles || 0}</h3><p>Duplicates</p></div>
            <div className="tooltip">Papers with identical titles.</div>
         </div>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {inputStats.headers && inputStats.headers.map((head, index) => (
                <th key={index}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inputStats.rows && inputStats.rows.slice(0, 50).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">Previewing first 50 rows</div>
      </div>
    </div>
  );
};

export default DataPreview;
