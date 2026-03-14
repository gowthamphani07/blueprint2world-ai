import React, { useState } from 'react';
import axios from 'axios';
import SceneGenerator from './SceneGenerator';
import './App.css';

function App() {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRoof, setShowRoof] = useState(true);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await axios.post("https://digestible-interminable-katy.ngrok-free.dev/api/upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLayout(response.data);
    } catch (error) {
      console.error("Error:", error);
      alert("Backend not running? Start with: uvicorn main:app --reload");
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="title">
          <h1>Blueprint2World AI</h1>
          <p>2D Floorplan → Interactive 3D Model</p>
        </div>
        <div className="controls">
          <label className="upload-btn">
            📁 Upload Blueprint
            <input type="file" accept="image/*" onChange={handleUpload} />
          </label>
          {layout && (
            <button 
              className={`roof-btn ${showRoof ? 'roof-on' : 'roof-off'}`}
              onClick={() => setShowRoof(!showRoof)}
            >
              {showRoof ? '👁️ Remove Roof' : '🏠 Add Roof'}
            </button>
          )}
        </div>
      </header>

      <div className="main">
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>AI Processing Blueprint...</p>
          </div>
        )}

        {layout ? (
          <SceneGenerator layoutData={layout} showRoof={showRoof} />
        ) : (
          <div className="placeholder">
            <div className="icon">📐</div>
            <h2>Upload Floorplan Image</h2>
            <p>Watch it transform into a 3D model instantly</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

