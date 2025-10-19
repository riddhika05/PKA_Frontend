import React, { useState, useEffect } from "react";
import "./App.css"; 
import BG_VID from "./assets/BG_VID.mp4"; 


const Chatbot = () => {
  
  const [showSetupModal, setShowSetupModal] = useState(true);
  
 
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]); 

  
  useEffect(() => {
    let timer;
    if (showAlertModal) {
       timer = setTimeout(() => {
        setShowAlertModal(false);
        setAlertMessage("");
      }, 10000); 
    }
   
    return () => clearTimeout(timer);
  }, [showAlertModal]);

  
  const displayAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const handleAddFiles = () => {
    const fileInput = document.getElementById('fileInput');
    fileInput.click();
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setSelectedFiles(files);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('http://127.0.0.1:8000/upload_files', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(`Successfully uploaded ${files.length} file(s) to workspace`, 'success');
        setSelectedFiles([]);
        // Reset the file input
        event.target.value = '';
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}: Failed to upload files.`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Could not connect to the API. Is the server running?", "error");
    }
  };

  const handleAddFolders = () => {
    const folderInput = document.getElementById('folderInput');
    folderInput.click();
  };

  const handleFolderSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setSelectedFolders(files);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('folders', file);
      });

      const response = await fetch('http://127.0.0.1:8000/upload_folders', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log(data)
      if (response.ok) {
        displayAlert(`Successfully uploaded ${files.length} folder(s) to workspace`, 'success');
        setSelectedFolders([]);
        // Reset the folder input
        event.target.value = '';
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}: Failed to upload folders.`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Could not connect to the API. Is the server running?", "error");
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/setup_workspace",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      
      const data = await response.json();

      if (response.ok) {
       
        displayAlert(data.message, "success");
        setShowSetupModal(false); 
      } else {
       
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}: Failed to set up workspace.`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
     
      displayAlert("Network Error: Could not connect to the API. Is the server running?", "error");
    }
  };
  
  const alertConfig = {
    success: { 
      bg: "bg-green-100", 
      text: "text-green-800", 
      border: "border-green-500", 
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm-3.293-9.293a1 1 0 011.414-1.414L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4z" // Checkmark
    },
    error: { 
      bg: "bg-red-100", 
      text: "text-red-800", 
      border: "border-red-500", 
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" // X-mark
    }
  };
  const config = alertConfig[alertType];

  return (
    <>
    
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover" 
        >
          <source src={BG_VID} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      
     
      {showSetupModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center min-w-[320px] text-gray-700">
            <h2 className="mb-4 font-bold text-xl text-center">
              Let us create your workspace!
            </h2>
            <button
              className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-8 py-3 text-base shadow-lg transition-colors transform hover:scale-[1.03]"
              onClick={handleCreateWorkspace}
            >
              Create Workspace
            </button>
          </div>
        </div>
      )}

     
      {showAlertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div 
            className={`w-full max-w-lg mx-4 p-5 rounded-lg border-l-4 shadow-xl ${config.bg} ${config.border} transform transition-all duration-300 pointer-events-auto`}
          >
            <div className="flex items-start space-x-4">
             
              <div className="flex-shrink-0 pt-1">
                <svg className={`h-6 w-6 ${config.text}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={config.icon} clipRule="evenodd" />
                </svg>
              </div>
              
            
              <div className="flex-1">
                <p className={`text-lg font-medium ${config.text}`}>
                  {alertType === 'success' ? 'Workspace Setup Success' : 'Error'}
                </p>
                <p className={`mt-1 text-sm ${config.text} break-words`}>
                  {alertMessage}
                </p>
              </div>
              
             
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className={`inline-flex rounded-md p-1.5 ${config.text} hover:opacity-80 transition`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className={`text-xs mt-1 ${config.text} text-right`}>
                  (Auto-hides in 10s)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!showSetupModal && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-white p-8 bg-black bg-opacity-30">
         
          <input
            id="fileInput"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <input
            id="folderInput"
            type="file"
            multiple
            onChange={handleFolderSelect}
            className="hidden"
            webkitdirectory=""
            directory=""
            mozdirectory=""
          />
         
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleAddFiles}>Add Files to Workspace</button>
            <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleAddFolders}>Add Folders to Workspace</button>
          </div>
         
        
        </div>
      )}
    </>
  );
};

export default Chatbot;
