import React from 'react';
import './DragDropZone.css';
import { useDrag, useDrop } from 'react-dnd';

const ColumnItem = ({ name }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COLUMN',
    item: { name },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));
  
  return (
    <div 
      ref={drag} 
      className="column-item" 
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {name}
    </div>
  );
};

const AxisDropZone = ({ label, onDrop, current, axisType }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COLUMN',
    drop: (item) => onDrop(item.name),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div 
      ref={drop} 
      className={`axis ${current ? 'has-value' : ''} ${isOver ? 'drag-over' : ''}`}
    >
      <div className="axis-label">{label}</div>
      <div className="axis-value">
        {current || 'Drop column here'}
      </div>
    </div>
  );
};

const YAxisDropZone = ({ onDrop, yAxes }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COLUMN',
    drop: (item) => onDrop(item.name),
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  }));

  return (
    <div 
      ref={drop} 
      className={`y-axis-zone ${isOver ? 'drag-over' : ''}`}
    >
      <div className="axis-label">Y Axes</div>
      <div className="y-axis-content">
        {yAxes.length > 0 ? (
          yAxes.map((axis, index) => (
            <div key={index} className="y-axis-item" style={{ borderLeftColor: axis.color }}>
              {axis.name}
            </div>
          ))
        ) : (
          <div className="axis-value">Drop columns here for multiple Y-axes</div>
        )}
      </div>
    </div>
  );
};

const DragDropZone = ({ 
  columns, 
  xAxis, 
  setXAxis, 
  yAxes, 
  setYAxes, 
  handleAddYAxis, 
  handleRemoveYAxis, 
  handleYAxisChange, 
  getAvailableYAxisColumns,
  xAxisLabel,
  setXAxisLabel,
  yAxisLabel,
  setYAxisLabel
}) => {
  if (columns.length === 0) {
    return (
      <div className="empty-state">
        <p>Upload a file to see available columns</p>
      </div>
    );
  }

  const handleYAxisDrop = (columnName) => {
    const usedYCols = new Set(yAxes.map(y => y.name));
    if (!usedYCols.has(columnName) && columnName !== xAxis) {
      const getRandomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      setYAxes(prev => [...prev, { 
        name: columnName, 
        color: getRandomColor(),
        label: columnName
      }]);
    }
  };

  return (
    <div className="drop-zone">
      <div className="columns-section">
        <h3 className="section-title">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Available Columns
        </h3>
        <div className="columns">
          {columns.map((col) => (
            <ColumnItem key={col} name={col} />
          ))}
        </div>
      </div>

      <div className="axes-section">
        <AxisDropZone 
          label="X Axis" 
          current={xAxis} 
          onDrop={setXAxis}
          axisType="x"
        />
        <YAxisDropZone 
          onDrop={handleYAxisDrop}
          yAxes={yAxes}
        />
      </div>

      {/* Custom Labels Section */}
      <div className="labels-section">
        <h3 className="section-title">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
          Custom Labels
        </h3>
        <div className="labels-grid">
          <div className="label-input-group">
            <label className="label-input-label">X-Axis Label</label>
            <input
              type="text"
              value={xAxisLabel}
              onChange={(e) => setXAxisLabel(e.target.value)}
              placeholder={xAxis || "X-Axis"}
              className="label-input"
            />
          </div>
          <div className="label-input-group">
            <label className="label-input-label">Y-Axis Label</label>
            <input
              type="text"
              value={yAxisLabel}
              onChange={(e) => setYAxisLabel(e.target.value)}
              placeholder="Y-Axis"
              className="label-input"
            />
          </div>
        </div>
      </div>

      {/* Y-Axes Management Section */}
      {yAxes.length > 0 && (
        <div className="y-axes-management">
          <h3 className="section-title">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
            Y-Axes Configuration
          </h3>
          <div className="y-axes-list">
            {yAxes.map((axis, index) => (
              <div key={index} className="y-axis-config">
                <select
                  value={axis.name}
                  onChange={(e) => handleYAxisChange(index, 'name', e.target.value)}
                  className="y-axis-select"
                >
                  <option value={axis.name}>{axis.name}</option>
                  {getAvailableYAxisColumns(index).map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={axis.label || axis.name}
                  onChange={(e) => handleYAxisChange(index, 'label', e.target.value)}
                  placeholder="Custom label"
                  className="y-axis-label-input"
                />
                <input
                  type="color"
                  value={axis.color}
                  onChange={(e) => handleYAxisChange(index, 'color', e.target.value)}
                  className="y-axis-color-input"
                  title="Choose series color"
                />
                <button
                  onClick={() => handleRemoveYAxis(index)}
                  className="y-axis-remove-btn"
                  title="Remove series"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddYAxis}
            className="add-y-axis-btn"
            disabled={columns.length === 0}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Y-Axis Series
          </button>
        </div>
      )}

      <div className="drag-instructions">
        💡 Drag columns to X-Axis or Y-Axes zones, then customize colors and labels below
      </div>
    </div>
  );
};

export default DragDropZone;