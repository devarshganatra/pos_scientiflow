import React, { useState } from 'react';
import './FileUploader.css';

const FileUploader = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.json')) {
        setUploadStatus('Processing file...');
        try {
          // Create a fake event object to match the existing onUpload handler
          const fakeEvent = { target: { files: [file] } };
          await onUpload(fakeEvent);
          setUploadStatus('Upload successful!');
          setTimeout(() => setUploadStatus(''), 3000);
        } catch (error) {
          setUploadStatus('Upload failed. Please try again.');
          setTimeout(() => setUploadStatus(''), 3000);
        }
      } else {
        setUploadStatus('Please upload a CSV or JSON file');
        setTimeout(() => setUploadStatus(''), 3000);
      }
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files.length > 0) {
      setUploadStatus('Processing file...');
      try {
        await onUpload(e);
        setUploadStatus('Upload successful!');
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
        setUploadStatus('Upload failed. Please try again.');
        setTimeout(() => setUploadStatus(''), 3000);
      }
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-section">
        <h2 className="upload-title">Upload Your Data</h2>
        <p className="upload-subtitle">Choose a CSV or JSON file to get started</p>
        
        <div className="file-input-wrapper">
          <input
            type="file"
            accept=".csv,.json"
            onChange={handleFileChange}
            className="file-input"
            id="file-input"
          />
          <label htmlFor="file-input" className="file-input-button">
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Choose File
          </label>
        </div>

        <div 
          className={`drag-drop-area ${isDragging ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drag-drop-content">
            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
            </svg>
            <p>Or drag and drop your file here</p>
          </div>
        </div>

        <div className="supported-formats">
          <span className="format-tag">CSV</span>
          <span className="format-tag">JSON</span>
        </div>

        {uploadStatus && (
          <div className={`upload-status ${uploadStatus.includes('successful') ? 'success' : uploadStatus.includes('Processing') ? 'loading' : 'error'}`}>
            {uploadStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;