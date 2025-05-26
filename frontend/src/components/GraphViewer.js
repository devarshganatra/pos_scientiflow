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
  setXAxisLabel,
  yAxisLabel,
  setYAxisLabel
}) => {
  const [plotData, setPlotData] = useState([]);
  const [plotLayout, setPlotLayout] = useState({});
  const [exportQuality, setExportQuality] = useState('publication');
  const [exportFormat, setExportFormat] = useState('png');
  const [colorPalette, setColorPalette] = useState('default');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({
    width: '',
    height: '',
    dpi: ''
  });
  const [qualityPresets, setQualityPresets] = useState({});
  const [colorPalettes, setColorPalettes] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  // Fetch quality presets and color palettes on component mount
  useEffect(() => {
    fetchQualityPresets();
    fetchColorPalettes();
  }, []);

  const fetchQualityPresets = async () => {
    try {
      const response = await fetch('http://localhost:8000/quality_presets');
      const data = await response.json();
      setQualityPresets(data);
    } catch (error) {
      console.error('Error fetching quality presets:', error);
    }
  };

  const fetchColorPalettes = async () => {
    try {
      const response = await fetch('http://localhost:8000/color_palettes');
      const data = await response.json();
      setColorPalettes(data);
    } catch (error) {
      console.error('Error fetching color palettes:', error);
    }
  };

  // Generate scientific chart with backend
  useEffect(() => {
    if (data.length === 0 || !xAxis || yAxes.length === 0) {
      setPlotData([]);
      setPlotLayout({});
      setChartReady(false);
      return;
    }

    generateScientificChart();
  }, [data, xAxis, yAxes, graphType, xAxisLabel, yAxisLabel, colorPalette]);

  const generateScientificChart = async () => {
    try {
      const requestBody = {
        fileData: data,
        xAxis: xAxis,
        yAxes: yAxes.map(axis => ({
          name: axis.name,
          color: axis.color
        })),
        chartType: graphType,
        fileName: 'chart_data'
      };

      const response = await fetch(`http://localhost:8000/generate_chart?color_palette=${colorPalette}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to generate chart');
      }

      const result = await response.json();
      const chartData = JSON.parse(result.chartData);

      // Apply frontend styling for better integration
      const layout = {
        ...chartData.layout,
        title: {
          ...chartData.layout.title,
          text: `${xAxisLabel || xAxis} vs ${yAxes.map(y => y.label || y.name).join(', ')}`
        },
        xaxis: {
          ...chartData.layout.xaxis,
          title: xAxisLabel || xAxis
        },
        yaxis: {
          ...chartData.layout.yaxis,
          title: yAxisLabel || (yAxes.length === 1 ? (yAxes[0].label || yAxes[0].name) : 'Values')
        }
      };

      setPlotData(chartData.data);
      setPlotLayout(layout);
      setChartReady(true);
    } catch (error) {
      console.error('Error generating scientific chart:', error);
      setChartReady(false);
    }
  };

  const handleScientificExport = async () => {
    if (!data || yAxes.length === 0) {
      alert('Please generate a chart first');
      return;
    }

    setIsExporting(true);

    try {
      const requestBody = {
        fileData: data,
        xAxis: xAxis,
        yAxes: yAxes.map(axis => ({
          name: axis.name,
          color: axis.color
        })),
        chartType: graphType,
        fileName: 'scientific_chart'
      };

      // Build query parameters
      const params = new URLSearchParams({
        quality: exportQuality,
        format: exportFormat,
        color_palette: colorPalette
      });
      
      // Add custom dimensions if specified
      if (customDimensions.width) params.append('custom_width', customDimensions.width);
      if (customDimensions.height) params.append('custom_height', customDimensions.height);
      if (customDimensions.dpi) params.append('custom_dpi', customDimensions.dpi);

      const response = await fetch(`http://localhost:8000/export_chart?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Export failed');
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `scientific_chart_${exportQuality}_${Date.now()}.${exportFormat}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('Scientific chart exported successfully');
    } catch (error) {
      console.error('Scientific export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = () => {
    const plotEl = document.querySelector('.js-plotly-plot');
    if (plotEl && window.Plotly) {
      window.Plotly.downloadImage(plotEl, { 
        format: 'png', 
        filename: 'scientiflow-quick-export',
        width: 1200,
        height: 800,
        scale: 2,
      });
    }
  };

  const getQualityDescription = (quality) => {
    if (!qualityPresets.presets || !qualityPresets.presets[quality]) {
      return "Loading...";
    }
    const preset = qualityPresets.presets[quality];
    return `${preset.width}×${preset.height}, ${preset.dpi_equivalent || 'N/A'} DPI equivalent`;
  };

  const getColorPaletteDescription = (palette) => {
    if (!colorPalettes.descriptions) return "";
    return colorPalettes.descriptions[palette] || "";
  };

  if (!xAxis || yAxes.length === 0) {
    return (
      <div className="graph-container">
        <div className="graph-header">
          <h3 className="graph-title">Scientific Visualization</h3>
        </div>
        <div className="graph-placeholder">
          <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="placeholder-title">Ready for Scientific Visualization</h4>
          <p className="placeholder-subtitle">
            Drop columns onto X axis and at least one Y axis to generate your publication-ready chart
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
            <label className="control-label">Color Palette</label>
            <select 
              value={colorPalette} 
              onChange={(e) => setColorPalette(e.target.value)}
              className="graph-select"
              title={getColorPaletteDescription(colorPalette)}
            >
              <option value="default">Default</option>
              <option value="colorblind">Colorblind Safe</option>
              <option value="nature">Nature Journal</option>
              <option value="science">Science Journal</option>
              <option value="grayscale">Grayscale</option>
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

          <div className="control-group">
            <label className="control-label">Y-Axis Label</label>
            <input
              type="text"
              value={yAxisLabel || ''}
              onChange={(e) => setYAxisLabel(e.target.value)}
              placeholder="Y-Axis"
              className="graph-input"
            />
          </div>
          
          {/* Export Controls */}
          <div className="export-controls">
            <button className="export-button" onClick={handleQuickExport}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Quick Export
            </button>
            
            <button 
              className="scientific-export-button"
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Scientific Export
            </button>
          </div>
        </div>
      </div>

      {/* Scientific Export Options Panel */}
      {showExportOptions && (
        <div className="export-options-panel scientific-panel">
          <div className="export-options-header">
            <h4>Scientific Publication Export</h4>
            <button 
              className="close-button"
              onClick={() => setShowExportOptions(false)}
            >
              ×
            </button>
          </div>
          
          <div className="export-options-content">
            <div className="options-grid">
              <div className="option-group">
                <label className="option-label">Quality Preset</label>
                <select 
                  value={exportQuality} 
                  onChange={(e) => setExportQuality(e.target.value)}
                  className="option-select"
                >
                  <option value="draft">Draft (200 DPI)</option>
                  <option value="manuscript">Manuscript (300 DPI)</option>
                  <option value="publication">Publication (300 DPI)</option>
                  <option value="high_res">High Resolution (400 DPI)</option>
                  <option value="poster">Poster (500 DPI)</option>
                </select>
                <small className="option-description">
                  {getQualityDescription(exportQuality)}
                </small>
              </div>

              <div className="option-group">
                <label className="option-label">Export Format</label>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="option-select"
                >
                  <option value="png">PNG (Raster)</option>
                  <option value="svg">SVG (Vector)</option>
                  <option value="pdf">PDF (Vector)</option>
                </select>
                <small className="option-description">
                  {exportFormat === 'png' && 'Best for web and most applications'}
                  {exportFormat === 'svg' && 'Scalable vector format, ideal for editing'}
                  {exportFormat === 'pdf' && 'Vector format, perfect for publications'}
                </small>
              </div>
            </div>

            <div className="custom-dimensions">
              <h5>Custom Settings (Optional)</h5>
              <div className="dimension-inputs">
                <div className="dimension-input">
                  <label>Width (px)</label>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={customDimensions.width}
                    onChange={(e) => setCustomDimensions(prev => ({
                      ...prev,
                      width: e.target.value
                    }))}
                    min="400"
                    max="4000"
                  />
                </div>
                <div className="dimension-input">
                  <label>Height (px)</label>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={customDimensions.height}
                    onChange={(e) => setCustomDimensions(prev => ({
                      ...prev,
                      height: e.target.value
                    }))}
                    min="300"
                    max="3000"
                  />
                </div>
                <div className="dimension-input">
                  <label>DPI</label>
                  <input
                    type="number"
                    placeholder="Auto"
                    value={customDimensions.dpi}
                    onChange={(e) => setCustomDimensions(prev => ({
                      ...prev,
                      dpi: e.target.value
                    }))}
                    min="150"
                    max="600"
                    step="50"
                  />
                </div>
              </div>
            </div>

            <div className="scientific-recommendations">
              <h5>📚 Publication Guidelines</h5>
              <ul>
                <li><strong>Journals:</strong> 300 DPI, PNG or PDF format</li>
                <li><strong>Posters:</strong> 500 DPI for large format printing</li>
                <li><strong>Web/Presentations:</strong> 200-300 DPI sufficient</li>
                <li><strong>Color:</strong> Use colorblind-safe palettes for accessibility</li>
              </ul>
            </div>

            <button 
              className="export-action-button scientific-export-action"
              onClick={handleScientificExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="loading-spinner"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Export Scientific {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="graph-wrapper">
        {chartReady && plotData.length > 0 ? (
          <Plot
            data={plotData}
            layout={plotLayout}
            style={{ width: '100%', height: '600px' }}
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
        ) : data.length > 0 && xAxis && yAxes.length > 0 ? (
          <div className="graph-loading">
            <div className="loading-spinner"></div>
            <span>Generating scientific chart...</span>
          </div>
        ) : (
          <div className="graph-placeholder">
            <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="placeholder-title">Configure Your Chart</h4>
            <p className="placeholder-subtitle">Set up axes to generate visualization</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphViewer;