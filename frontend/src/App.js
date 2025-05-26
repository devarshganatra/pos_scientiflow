import React, { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import DragDropZone from './components/DragDropZone';
import GraphViewer from './components/GraphViewer';

// Helper to generate random colors for new axes
const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

function App() {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [xAxis, setXAxis] = useState(null);
  const [yAxes, setYAxes] = useState([]);
  const [graphType, setGraphType] = useState('scatter');
  const [xAxisLabel, setXAxisLabel] = useState('');
  const [yAxisLabel, setYAxisLabel] = useState('');
  const [fileName, setFileName] = useState('');
  const [isConnectedToBackend, setIsConnectedToBackend] = useState(false);

  // Check backend connection on component mount
  React.useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/quality_presets');
      if (response.ok) {
        setIsConnectedToBackend(true);
        console.log('✅ Backend connected - Scientific export features available');
      }
    } catch (error) {
      console.log('⚠️ Backend not connected - Using basic export only');
      setIsConnectedToBackend(false);
    }
  };

  // Updated handleFileUpload to work with the new FileUploader
  const handleFileUpload = (result, uploadedFileName) => {
    if (result && result.columns && result.data) {
      console.log('Setting data:', result);
      setColumns(result.columns);
      setData(result.data);
      setFileName(uploadedFileName);
      
      // Reset axes when new file is uploaded
      setXAxis(null);
      setYAxes([]);
      setXAxisLabel('');
      setYAxisLabel('');
      
      // Log data structure for debugging
      console.log('📊 Data loaded:', {
        fileName: uploadedFileName,
        columns: result.columns,
        rowCount: result.data.length,
        sampleData: result.data.slice(0, 3)
      });
    } else {
      console.error('Invalid data format received:', result);
    }
  };

  // Fallback for the old file upload method (if needed)
  const handleLegacyFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      handleFileUpload(json, file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  const handleAddYAxis = () => {
    const usedYCols = new Set(yAxes.map(y => y.name));
    const firstUnusedCol = columns.find(c => c !== xAxis && !usedYCols.has(c));
    
    if (firstUnusedCol) {
      const newAxis = { 
        name: firstUnusedCol, 
        color: getRandomColor(),
        label: firstUnusedCol // Default label to column name
      };
      
      setYAxes(prev => [...prev, newAxis]);
      
      console.log('📈 Added Y-axis:', newAxis);
    } else {
      console.log('⚠️ No more columns available for Y-axis');
    }
  };

  const handleRemoveYAxis = (indexToRemove) => {
    const removedAxis = yAxes[indexToRemove];
    setYAxes(prev => prev.filter((_, index) => index !== indexToRemove));
    console.log('🗑️ Removed Y-axis:', removedAxis);
  };

  const handleYAxisChange = (index, field, value) => {
    setYAxes(prev => {
      const newYAxes = [...prev];
      const oldValue = newYAxes[index][field];
      newYAxes[index] = { ...newYAxes[index], [field]: value };
      
      console.log(`🔧 Updated Y-axis ${index} ${field}:`, { from: oldValue, to: value });
      return newYAxes;
    });
  };

  const getAvailableYAxisColumns = (currentIndex) => {
    const selectedYAxesNames = new Set(
      yAxes
        .filter((_, idx) => idx !== currentIndex)
        .map(axis => axis.name)
    );
    return columns.filter(col => col !== xAxis && !selectedYAxesNames.has(col));
  };

  // Handle axis label changes
  const handleXAxisLabelChange = (label) => {
    setXAxisLabel(label);
    console.log('🏷️ X-axis label updated:', label);
  };

  const handleYAxisLabelChange = (label) => {
    setYAxisLabel(label);
    console.log('🏷️ Y-axis label updated:', label);
  };

  // Handle graph type changes
  const handleGraphTypeChange = (type) => {
    setGraphType(type);
    console.log('📊 Graph type changed to:', type);
  };

  return (
    <div className="app-container">
      <div className="header-section">
        <img src="/logo.svg" alt="ScientiFlow Logo" className="logo" />
        <h1 className="app-title">ScientiFlow</h1>
        <p className="app-subtitle">
          Transform your data into publication-ready scientific visualizations
          {isConnectedToBackend && (
            <span className="feature-badge">🔬 Scientific Export Enabled</span>
          )}
        </p>
      </div>

      <div className="main-content">
        {/* File Upload Section */}
        <div className="card">
          <FileUploader onUpload={handleFileUpload} />
          
          {/* Backend Status Indicator */}
          <div className={`status-indicator ${isConnectedToBackend ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {isConnectedToBackend 
                ? 'Scientific Backend Connected' 
                : 'Basic Mode (Backend Offline)'
              }
            </span>
            {!isConnectedToBackend && (
              <button 
                className="retry-connection"
                onClick={checkBackendConnection}
                title="Retry backend connection"
              >
                🔄
              </button>
            )}
          </div>
        </div>

        {/* Axis Configuration Section */}
        {columns.length > 0 && (
          <div className="card">
            <div className="section-header">
              <h3>📊 Chart Configuration</h3>
              <div className="data-info">
                <span className="data-filename">{fileName}</span>
                <span className="data-stats">
                  {columns.length} columns, {data.length} rows
                </span>
              </div>
            </div>
            
            <DragDropZone
              columns={columns}
              xAxis={xAxis} 
              setXAxis={setXAxis}
              yAxes={yAxes}
              setYAxes={setYAxes}
              handleAddYAxis={handleAddYAxis}
              handleRemoveYAxis={handleRemoveYAxis}
              handleYAxisChange={handleYAxisChange}
              getAvailableYAxisColumns={getAvailableYAxisColumns}
              xAxisLabel={xAxisLabel}
              setXAxisLabel={handleXAxisLabelChange}
              yAxisLabel={yAxisLabel}
              setYAxisLabel={handleYAxisLabelChange}
            />
          </div>
        )}

        {/* Graph Visualization Section */}
        {(xAxis || yAxes.length > 0) && (
          <div className="card full-width-card">
            <div className="section-header">
              <h3>📈 Scientific Visualization</h3>
              {isConnectedToBackend && (
                <div className="scientific-features">
                  <span className="feature-tag">Publication Ready</span>
                  <span className="feature-tag">Multiple Formats</span>
                  <span className="feature-tag">High DPI Export</span>
                </div>
              )}
            </div>
            
            <GraphViewer
              data={data}
              xAxis={xAxis}
              yAxes={yAxes}
              graphType={graphType}
              setGraphType={handleGraphTypeChange}
              xAxisLabel={xAxisLabel}
              setXAxisLabel={handleXAxisLabelChange}
              yAxisLabel={yAxisLabel}
              setYAxisLabel={handleYAxisLabelChange}
              fileName={fileName}
              isBackendConnected={isConnectedToBackend}
            />
          </div>
        )}

        {/* Quick Stats Section */}
        {data.length > 0 && (
          <div className="card stats-card">
            <h4>📋 Data Summary</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Dataset</span>
                <span className="stat-value">{fileName}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Columns</span>
                <span className="stat-value">{columns.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Rows</span>
                <span className="stat-value">{data.length.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Chart Type</span>
                <span className="stat-value">{graphType}</span>
              </div>
              {xAxis && (
                <div className="stat-item">
                  <span className="stat-label">X-Axis</span>
                  <span className="stat-value">{xAxisLabel || xAxis}</span>
                </div>
              )}
              {yAxes.length > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Y-Axes</span>
                  <span className="stat-value">{yAxes.length}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>ScientiFlow - Powered by FastAPI + React</p>
          <div className="footer-links">
            <span>Scientific Visualization Tool</span>
            {isConnectedToBackend && <span>• Publication Export Ready</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;