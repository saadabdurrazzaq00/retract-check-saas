import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Play, ArrowLeft, FileText, Layout, 
  AlertTriangle, CheckCircle, TrendingUp, Users, 
  Download, Database, ShieldAlert, Copy 
} from 'lucide-react';
import './DataPreview.css';

const DataPreview = ({ data, onBack }) => {
  const [viewState, setViewState] = useState('input'); // input | processing | results
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState(null);

  // --- 1. MEMOIZED INPUT STATS (Initial View) ---
  const inputStats = useMemo(() => {
    if (!data || data.length === 0) return {};
    
    // Safety check: Filter out completely empty rows immediately
    const validData = data.filter(row => row && row.length > 0);
    if (validData.length === 0) return {};

    const headers = validData[0];
    const rows = validData.slice(1);
    const totalRows = rows.length;
    const totalCols = headers.length;

    // --- FIX: SAFE INDEX FINDER ---
    // We check (h && ...) to ensure the header isn't null/undefined before checking text
    const getIndex = (name) => headers.findIndex(h => h && h.toString().toUpperCase().trim() === name);
    
    const pyIndex = getIndex('PY');
    const doiIndex = getIndex('DOI');
    const auIndex = getIndex('AU');
    const titleIndex = getIndex('TITLE');

    // 1. Peak Year
    let peakYear = "N/A";
    if (pyIndex !== -1) {
      const yearCounts = {};
      rows.forEach(r => {
        // Safe parse
        if (r[pyIndex]) {
            const y = parseInt(r[pyIndex]);
            if (!isNaN(y) && y > 1900 && y < 2100) yearCounts[y] = (yearCounts[y] || 0) + 1;
        }
      });
      if (Object.keys(yearCounts).length > 0) {
        peakYear = Object.keys(yearCounts).reduce((a, b) => yearCounts[a] > yearCounts[b] ? a : b);
      }
    }

    // 2. DOI Coverage
    let doiCount = 0;
    if (doiIndex !== -1) {
        doiCount = rows.filter(r => r[doiIndex] && r[doiIndex].toString().trim().length > 5).length;
    }
    const doiCoverage = totalRows > 0 ? Math.round((doiCount / totalRows) * 100) + '%' : '0%';

    // 3. Unique Authors
    let uniqueAuthors = 0;
    if (auIndex !== -1) {
      uniqueAuthors = new Set(rows.map(r => r[auIndex]).filter(Boolean)).size;
    }

    // 4. Duplicate Titles
    let duplicateTitles = 0;
    if (titleIndex !== -1) {
      const titles = rows.map(r => r[titleIndex] ? r[titleIndex].toString().toLowerCase().trim() : "");
      duplicateTitles = titles.length - new Set(titles).size;
    }

    return { totalRows, totalCols, doiCoverage, peakYear, uniqueAuthors, duplicateTitles, headers, rows };
  }, [data]);

  // --- 2. AUTOMATION LOGIC ---
  const handleStart = async () => {
    setViewState('processing');
    setProgress(0);
    
    try {
      const response = await fetch('/assets/retraction_watch.csv');
      if (!response.ok) throw new Error("Database file missing");
      const csvText = await response.text();

      // Fake progress
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
          const retractionMap = new Map();
          
          referenceData.forEach(item => {
            if (item.OriginalPaperDOI) {
              retractionMap.set(item.OriginalPaperDOI.trim().toLowerCase(), item);
            }
          });

          // Map Input to Output
          // Safe map: Ensure h exists before calling toUpperCase
          const inputHeaders = data[0].map(h => h ? h.toString().toUpperCase().trim() : "");
          
          const getVal = (row, colName) => {
            const index = inputHeaders.indexOf(colName);
            return index !== -1 && row[index] !== undefined ? row[index] : "";
          };

          const outputHeaders = [
            "UT", "TITLE", "DOI", "AU", "PY", 
            "RetractionStatus", 
            "Subject", "Institution", "Journal", "Publisher", "Country", "Author", 
            "URLS", "ArticleType", "Date", "PubMedID", "Reason", "Paywalled"
          ];

          const outputRows = data.slice(1).map(row => {
            const rawDoi = getVal(row, "DOI");
            const cleanDoi = rawDoi ? rawDoi.toString().trim().toLowerCase() : "";
            const match = retractionMap.get(cleanDoi);

            let status = "No Retractions found matching selected criteria";
            let m = { Subject: "", Institution: "", Journal: "", Publisher: "", Country: "", Author: "", URLS: "", ArticleType: "", Date: "", PubMedID: "", Reason: "", Paywalled: "" };

            if (match) {
              const retDOI = match.RetractionDOI ? match.RetractionDOI.trim().toLowerCase() : "";
              const origDOI = match.OriginalPaperDOI ? match.OriginalPaperDOI.trim().toLowerCase() : "";

              if (retDOI !== origDOI) {
                 status = "Retractions found matching selected criteria";
                 m = {
                    Subject: match.Subject || "", Institution: match.Institution || "",
                    Journal: match.Journal || "", Publisher: match.Publisher || "",
                    Country: match.Country || "", Author: match.Author || "",
                    URLS: match.URLS || "", ArticleType: match.ArticleType || "",
                    Date: match.OriginalPaperDate || "", PubMedID: match.OriginalPaperPubMedID || "",
                    Reason: match.Reason || "", Paywalled: match.Paywalled || ""
                 };
              }
            }

            return [
              getVal(row, "UT"), getVal(row, "TITLE"), rawDoi, 
              getVal(row, "AU"), getVal(row, "PY"), status,
              m.Subject, m.Institution, m.Journal, m.Publisher, m.Country, 
              m.Author, m.URLS, m.ArticleType, m.Date, m.PubMedID, m.Reason, m.Paywalled
            ];
          });

          // --- CALCULATE RESULT STATS ---
          const foundCount = outputRows.filter(r => r[5] && r[5].startsWith("Retractions")).length;
          
          // Re-use logic for stats
          const pyIdx = 4;
          const auIdx = 3;
          const titleIdx = 1;
          
          let peakYear = "N/A";
          const yearCounts = {};
          outputRows.forEach(r => {
             if (r[pyIdx]) {
                const y = parseInt(r[pyIdx]);
                if(!isNaN(y)) yearCounts[y] = (yearCounts[y] || 0) + 1;
             }
          });
          if(Object.keys(yearCounts).length > 0) peakYear = Object.keys(yearCounts).reduce((a,b)=>yearCounts[a]>yearCounts[b]?a:b);

          const uniqueAuthors = new Set(outputRows.map(r => r[auIdx]).filter(Boolean)).size;
          
          const titles = outputRows.map(r => r[titleIdx] ? r[titleIdx].toString().toLowerCase().trim() : "");
          const duplicateTitles = titles.length - new Set(titles).size;

          setProcessedData({
            headers: outputHeaders,
            rows: outputRows,
            foundCount,
            totalRows: outputRows.length,
            peakYear,
            uniqueAuthors,
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
    link.setAttribute("download", "Final_Retraction_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- PROCESSING VIEW ---
  if (viewState === 'processing') {
    return (
      <div className="processing-container">
        <div className="scanner-animation">
          <div className="scan-line"></div>
          <Database size={64} className="db-icon" />
        </div>
        <h2>Cross-Referencing Database</h2>
        <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="processing-status">Checking papers against Retraction Watch...</p>
      </div>
    );
  }

  // --- RESULTS VIEW ---
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
              <button className="download-btn" onClick={handleDownload}><Download size={16} /> Download CSV</button>
           </div>
        </div>

        {/* RESULTS STATS GRID */}
        <div className="results-stats-grid">
           <div className="stat-card group">
              <div className="icon-box blue"><FileText size={20} /></div>
              <div><h3>{processedData.totalRows}</h3><p>Total Checked</p></div>
              <div className="tooltip">Total number of papers processed.</div>
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
              <div className="tooltip">Papers flagged as retracted.</div>
           </div>

           <div className="stat-card group">
              <div className="icon-box orange"><TrendingUp size={20} /></div>
              <div><h3>{processedData.peakYear}</h3><p>Peak Year</p></div>
              <div className="tooltip">Hottest year for research.</div>
           </div>

           <div className="stat-card group">
              <div className="icon-box indigo"><Users size={20} /></div>
              <div><h3>{processedData.uniqueAuthors}</h3><p>Unique Authors</p></div>
              <div className="tooltip">Distinct number of researchers.</div>
           </div>

           <div className="stat-card group">
              <div className="icon-box purple"><Copy size={20} /></div>
              <div><h3>{processedData.duplicateTitles}</h3><p>Duplicates</p></div>
              <div className="tooltip">Papers appearing more than once.</div>
           </div>
        </div>

        <div className="results-table-wrapper">
           <table className="results-table">
              <thead><tr>{processedData.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
              <tbody>
                 {processedData.rows.slice(0, 100).map((row, rIdx) => {
                    const isRetracted = row[5] && row[5].startsWith("Retractions found");
                    return (
                        <tr key={rIdx} className={isRetracted ? "retracted-row" : "clean-row"} style={{animationDelay: `${rIdx * 0.03}s`}}>
                            {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
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

  // --- INPUT PREVIEW (Default) ---
  return (
    <div className="preview-container fade-in">
      <div className="preview-header">
        <button onClick={onBack} className="back-btn"><ArrowLeft size={18} /> Back</button>
        <h2>Input Overview</h2>
        <button className="start-btn" onClick={handleStart}><Play size={18} /> Start Automation</button>
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
            <div className="icon-box orange"><TrendingUp size={20} /></div>
            <div><h3>{inputStats.peakYear || 'N/A'}</h3><p>Peak Year</p></div>
            <div className="tooltip">Hottest year for research.</div>
         </div>
         <div className="stat-card group">
            <div className="icon-box indigo"><Users size={20} /></div>
            <div><h3>{inputStats.uniqueAuthors || 0}</h3><p>Unique Authors</p></div>
            <div className="tooltip">Count of distinct author names.</div>
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