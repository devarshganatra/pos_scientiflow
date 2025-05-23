import React from 'react';
import Plot from 'react-plotly.js';
import './GraphViewer.css';

const GraphViewer = ({ data, xAxis, yAxis, graphType, setGraphType }) => {
  const plotData = [
    {
      type: graphType,
      x: data.map((d) => d[xAxis]),
      y: data.map((d) => d[yAxis]),
      mode: graphType === 'scatter' ? 'markers' : undefined,
      marker: {
        size: graphType === 'scatter' ? 8 : undefined,
        color: graphType === 'scatter' ? '#3b82f6' : '#10b981',
        opacity: 0.8,
      },
      line: {
        color: '#3b82f6',
        width: 3,
      },
    },
  ];

  const layout = {
    title: {
      text: `${graphType.charAt(0).toUpperCase() + graphType.slice(1)} Chart`,
      font: { size: 18, color: '#374151' },
    },
    xaxis: { 
      title: xAxis,
      gridcolor: '#f3f4f6',
      linecolor: '#e5e7eb',
    },
    yaxis: { 
      title: yAxis,
      gridcolor: '#f3f4f6',
      linecolor: '#e5e7eb',
    },
    plot_bgcolor: '#ffffff',
    paper_bgcolor: '#ffffff',
    font: { color: '#374151' },
    margin: { t: 60, r: 30, b: 60, l: 60 },
    showlegend: false,
  };

  const handleExport = () => {
    const plotEl = document.querySelector('.js-plotly-plot');
    if (plotEl && window.Plotly) {
      window.Plotly.downloadImage(plotEl, { 
        format: 'png', 
        filename: 'scientiflow-graph',
        width: 1200,
        height: 800,
      });
    }
  };

  if (!xAxis || !yAxis) {
    return (
      <div className="graph-container">
        <div className="graph-header">
          <h3 className="graph-title">Visualization</h3>
        </div>
        <div className="graph-placeholder">
          <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="placeholder-title">Ready to Visualize</h4>
          <p className="placeholder-subtitle">
            Drop columns onto both X and Y axes to generate your chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h3 className="graph-title">
          {xAxis} vs {yAxis}
        </h3>
        <div className="graph-controls">
          <div className="control-group">
            <label className="control-label">Chart Type</label>
            <select 
              value={graphType} 
              onChange={(e) => setGraphType(e.target.value)}
              className="graph-select"
            >
              <option value="scatter">Scatter Plot</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
          <button className="export-button" onClick={handleExport}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export PNG
          </button>
        </div>
      </div>

      <div className="graph-wrapper">
        <Plot
          data={plotData}
          layout={layout}
          style={{ width: '100%', height: '500px' }}
          config={{ 
            displayModeBar: true,
            responsive: true,
            toImageButtonOptions: {
              format: 'png',
              filename: 'scientiflow-graph',
              height: 800,
              width: 1200,
              scale: 1
            }
          }}
        />
      </div>
    </div>
  );
};

export default GraphViewer;