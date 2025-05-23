import React, { useState } from 'react';
import './App.css';
import FileUploader from './components/FileUploader';
import DragDropZone from './components/DragDropZone';
import GraphViewer from './components/GraphViewer';

function App() {
  const [columns, setColumns] = useState([]);
  const [data, setData] = useState([]);
  const [xAxis, setXAxis] = useState(null);
  const [yAxis, setYAxis] = useState(null);
  const [graphType, setGraphType] = useState('scatter');

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
  };

  return (
    <div className="app-container">
      <div className="header-section">
        <img src="/logo.png" alt="ScientiFlow Logo" className="logo" />
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
              yAxis={yAxis} 
              setYAxis={setYAxis}
            />
          </div>
        )}

        {(xAxis || yAxis || data.length > 0) && (
          <div className="card full-width-card">
            <GraphViewer
              data={data}
              xAxis={xAxis}
              yAxis={yAxis}
              graphType={graphType}
              setGraphType={setGraphType}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;