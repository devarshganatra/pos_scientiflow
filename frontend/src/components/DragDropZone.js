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

const DragDropZone = ({ columns, xAxis, setXAxis, yAxis, setYAxis }) => {
  if (columns.length === 0) {
    return (
      <div className="empty-state">
        <p>Upload a file to see available columns</p>
      </div>
    );
  }

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
        <AxisDropZone 
          label="Y Axis" 
          current={yAxis} 
          onDrop={setYAxis}
          axisType="y" 
        />
      </div>

      <div className="drag-instructions">
        💡 Drag columns from above and drop them onto the X and Y axis zones to create your visualization
      </div>
    </div>
  );
};

export default DragDropZone;