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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('http://localhost:8000/upload', {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    setColumns(json.columns);
    setData(json.data);
    
    // Reset axes when new file is uploaded
    setXAxis(null);
    setYAxes([]);
    setXAxisLabel('');
    setYAxisLabel('');
  };

  const handleAddYAxis = () => {
    const usedYCols = new Set(yAxes.map(y => y.name));
    const firstUnusedCol = columns.find(c => c !== xAxis && !usedYCols.has(c));
    
    if (firstUnusedCol) {
      setYAxes(prev => [...prev, { 
        name: firstUnusedCol, 
        color: getRandomColor(),
        label: firstUnusedCol // Default label to column name
      }]);
    }
  };

  const handleRemoveYAxis = (indexToRemove) => {
    setYAxes(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleYAxisChange = (index, field, value) => {
    setYAxes(prev => {
      const newYAxes = [...prev];
      newYAxes[index] = { ...newYAxes[index], [field]: value };
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

  return (
    <div className="app-container">
      <div className="header-section">
        <img src="/logo.svg" alt="ScientiFlow Logo" className="logo" />
        <h1 className="app-title">ScientiFlow</h1>
        <p className="app-subtitle">Transform your data into beautiful visualizations</p>
      </div>

      <div className="main-content">
        <div className="card">
          <FileUploader onUpload={handleFileUpload} />
        </div>

        {columns.length > 0 && (
          <div className="card">
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
              setXAxisLabel={setXAxisLabel}
              yAxisLabel={yAxisLabel}
              setYAxisLabel={setYAxisLabel}
            />
          </div>
        )}

        {(xAxis || yAxes.length > 0) && (
          <div className="card full-width-card">
            <GraphViewer
              data={data}
              xAxis={xAxis}
              yAxes={yAxes}
              graphType={graphType}
              setGraphType={setGraphType}
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;