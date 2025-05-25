import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './GraphViewer.css';

const GraphViewer = ({ 
  data, 
  xAxis, 
  yAxes, 
  graphType, 
  setGraphType,
  xAxisLabel,
  setXAxisLabel 
}) => {
  const [plotData, setPlotData] = useState([]);
  const [plotLayout, setPlotLayout] = useState({});

  useEffect(() => {
    if (data.length === 0 || !xAxis || yAxes.length === 0) {
      setPlotData([]);
      setPlotLayout({});
      return;
    }

    // Generate plot data for multiple Y-axes
    const newPlotData = yAxes.map((yAxis, index) => {
      const trace = {
        type: graphType,
        x: data.map((d) => d[xAxis]),
        y: data.map((d) => d[yAxis.name]),
        name: yAxis.label || yAxis.name,
        mode: graphType === 'scatter' ? 'markers' : undefined,
        marker: {
          size: graphType === 'scatter' ? 8 : undefined,
          color: yAxis.color,
          opacity: 0.8,
        },
        line: {
          color: yAxis.color,
          width: 3,
        },
      };

      // For bar charts, add some offset if multiple series
      if (graphType === 'bar' && yAxes.length > 1) {
        trace.offsetgroup = index;
      }

      return trace;
    });

    const newLayout = {
      title: {
        text: `${graphType.charAt(0).toUpperCase() + graphType.slice(1)} Chart`,
        font: { size: 18, color: '#374151' },
      },
      xaxis: { 
        title: xAxisLabel || xAxis,
        gridcolor: '#f3f4f6',
        linecolor: '#e5e7eb',
      },
      yaxis: { 
        title: yAxes.length === 1 ? (yAxes[0].label || yAxes[0].name) : 'Values',
        gridcolor: '#f3f4f6',
        linecolor: '#e5e7eb',
      },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff',
      font: { color: '#374151' },
      margin: { t: 60, r: 30, b: 60, l: 60 },
      showlegend: yAxes.length > 1,
      legend: {
        x: 1,
        xanchor: 'right',
        y: 1,
        bgcolor: 'rgba(255,255,255,0.8)',
        bordercolor: '#e5e7eb',
        borderwidth: 1,
      },
      barmode: graphType === 'bar' && yAxes.length > 1 ? 'group' : undefined,
    };

    setPlotData(newPlotData);
    setPlotLayout(newLayout);
  }, [data, xAxis, yAxes, graphType, xAxisLabel]);

  const handleExport = () => {
    const plotEl = document.querySelector('.js-plotly-plot');
    if (plotEl && window.Plotly) {
      window.Plotly.downloadImage(plotEl, { 
        format: 'png', 
        filename: 'scientiflow-graph',
        width: 1200,
        height: 800,
        scale: 2,
      });
    }
  };

  if (!xAxis || yAxes.length === 0) {
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
            Drop columns onto X axis and at least one Y axis to generate your chart
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h3 className="graph-title">
          {xAxisLabel || xAxis} vs {yAxes.map(y => y.label || y.name).join(', ')}
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
          <div className="control-group">
            <label className="control-label">X-Axis Label</label>
            <input
              type="text"
              value={xAxisLabel || ''}
              onChange={(e) => setXAxisLabel(e.target.value)}
              placeholder={xAxis}
              className="graph-input"
            />
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
        {plotData.length > 0 ? (
          <Plot
            data={plotData}
            layout={plotLayout}
            style={{ width: '100%', height: '500px' }}
            config={{ 
              displayModeBar: true,
              responsive: true,
              toImageButtonOptions: {
                format: 'png',
                filename: 'scientiflow-graph',
                height: 800,
                width: 1200,
                scale: 2
              }
            }}
          />
        ) : (
          <div className="graph-loading">
            <div className="loading-spinner"></div>
            <span>Loading chart...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphViewer;