import React, { useState, useEffect, useRef } from "react";
import "./App.css"; 
import BG_VID from "./assets/BG_VID.mp4"; 
import eating_cat from "./assets/Hungry.gif"

const Chatbot = () => {
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFolders, setSelectedFolders] = useState([]);
  
  // File management
  const [files, setFiles] = useState([]);
  const [showFileManager, setShowFileManager] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Chat interface
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/list_files');
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/collection_stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // UPLOAD INDIVIDUAL FILES
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

      const response = await fetch('http://127.0.0.1:8000/upload_and_index', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(`Successfully uploaded ${files.length} file(s)`, 'success');
        setSelectedFiles([]);
        event.target.value = '';
        fetchFiles();
        fetchStats();
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // UPLOAD FOLDERS
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
      const filePaths = [];
      
      files.forEach(file => {
        formData.append('files', file);
        filePaths.push(file.webkitRelativePath || file.name);
      });
      
      formData.append('file_paths', JSON.stringify(filePaths));

      const response = await fetch('http://127.0.0.1:8000/upload_and_index', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(`Successfully uploaded folder with ${files.length} file(s)`, 'success');
        setSelectedFolders([]);
        event.target.value = '';
        fetchFiles();
        fetchStats();
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // RE-INDEX ALL FILES
  const handleReindexAll = async () => {
    if (!window.confirm('Re-index all files in workspace? This may take a while.')) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/index_workspace', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(data.message, 'success');
        fetchStats();
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // CLEAN WORKSPACE (RESET COLLECTION)
  const handleCleanWorkspace = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL indexed data! Are you sure?')) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/reset_collection', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert('Workspace cleaned successfully!', 'success');
        fetchStats();
        setMessages([]);
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // DELETE FILE
  const handleDeleteFile = async (filePath) => {
    if (!window.confirm(`Delete ${filePath}?`)) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/delete_file?file_path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(`Deleted ${filePath}`, 'success');
        fetchFiles();
        fetchStats();
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, 'error');
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // SEND MESSAGE WITH STREAMING
  // SEND MESSAGE WITH STREAMING - FIXED VERSION
const handleSendMessage = async () => {
  if (!inputMessage.trim() || isLoading) return;

  const userMessage = inputMessage.trim();
  setInputMessage("");
  
  setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
  setIsLoading(true);

  // Add empty assistant message that we'll update
  setMessages(prev => [...prev, { 
    type: 'assistant', 
    content: '',
    sources: [],
    contextUsed: 0
  }]);

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/ask?question=${encodeURIComponent(userMessage)}&stream=true`, 
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedContent = ''; // Track content separately

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          
          try {
            const data = JSON.parse(jsonStr);
            
            if (data.content) {
              // Accumulate content
              accumulatedContent += data.content;
              
              // Update message with NEW object (immutable)
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex].type === 'assistant') {
                  newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    content: accumulatedContent
                  };
                }
                return newMessages;
              });
            }
            
            if (data.sources) {
              // Update sources
              setMessages(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                if (newMessages[lastIndex].type === 'assistant') {
                  newMessages[lastIndex] = {
                    ...newMessages[lastIndex],
                    sources: data.sources,
                    contextUsed: data.context_used || 0
                  };
                }
                return newMessages;
              });
            }

            if (data.error) {
              setMessages(prev => [...prev, { 
                type: 'error', 
                content: `Error: ${data.error}`
              }]);
              break;
            }
          } catch (e) {
            console.error('JSON parse error:', e, 'Raw:', jsonStr);
          }
        }
      }
    }
  } catch (error) {
    setMessages(prev => {
      const newMessages = [...prev];
      // Remove the empty assistant message and add error
      newMessages.pop();
      return [...newMessages, { 
        type: 'error', 
        content: `Network Error: ${error.message}`
      }];
    });
  } finally {
    setIsLoading(false);
  }
};
  const handleCreateWorkspace = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/setup_workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await response.json();

      if (response.ok) {
        displayAlert(data.message, "success");
        setShowSetupModal(false);
        fetchFiles();
        fetchStats();
      } else {
        const errorMessage = data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };
  
  const alertConfig = {
    success: { 
      bg: "bg-green-100", 
      text: "text-green-800", 
      border: "border-green-500", 
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm-3.293-9.293a1 1 0 011.414-1.414L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4z"
    },
    error: { 
      bg: "bg-red-100", 
      text: "text-red-800", 
      border: "border-red-500", 
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
    }
  };
  const config = alertConfig[alertType];

  return (
    <>
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src={BG_VID} type="video/mp4" />
        </video>
      </div>
      
      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
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

      {/* Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className={`w-full max-w-lg mx-4 p-5 rounded-lg border-l-4 shadow-xl ${config.bg} ${config.border} transform transition-all duration-300 pointer-events-auto`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 pt-1">
                <svg className={`h-6 w-6 ${config.text}`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={config.icon} clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className={`text-lg font-medium ${config.text}`}>
                  {alertType === 'success' ? 'Success' : 'Error'}
                </p>
                <p className={`mt-1 text-sm ${config.text} break-words`}>{alertMessage}</p>
              </div>
              <div className="flex-shrink-0">
                <button onClick={() => setShowAlertModal(false)} className={`inline-flex rounded-md p-1.5 ${config.text} hover:opacity-80 transition`}>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <p className={`text-xs mt-1 ${config.text} text-right`}>(Auto-hides in 10s)</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      {!showSetupModal && (
        <div className="relative z-10 flex h-screen">
          
          {/* Hidden Inputs */}
          <input id="fileInput" type="file" multiple onChange={handleFileSelect} className="hidden" />
          <input id="folderInput" type="file" multiple onChange={handleFolderSelect} className="hidden" webkitdirectory="" />
          
          {/* Sidebar */}
          <div className="w-80 bg-gray-900 bg-opacity-90 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <img src={eating_cat} alt="Cat" className="w-16 h-16 rounded-full" />
              <div>
                <h2 className="text-white font-bold text-lg">RAG Assistant</h2>
                {stats && (
                  <p className="text-gray-400 text-sm">
                    {stats.total_chunks} chunks • {stats.unique_files} files
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-6">
              <button onClick={handleAddFiles} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2">
                <span>📄</span> Add Files
              </button>
              <button onClick={handleAddFolders} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2">
                <span>📁</span> Add Folder
              </button>
              <button onClick={handleReindexAll} className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2">
                <span>🔄</span> Rebuild Index
              </button>
              <button onClick={handleCleanWorkspace} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition flex items-center justify-center gap-2">
                <span>🗑️</span> Clean Workspace
              </button>
            </div>

            {/* File Manager Toggle */}
            <button 
              onClick={() => {
                setShowFileManager(!showFileManager);
                if (!showFileManager) fetchFiles();
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition mb-4"
            >
              {showFileManager ? '📋 Hide Files' : '📋 Show Files'}
            </button>

            {/* File List */}
            {showFileManager && (
              <div className="bg-gray-800 rounded-lg p-3 max-h-96 overflow-y-auto">
                <h3 className="text-white font-semibold mb-2">Files ({files.length})</h3>
                {files.length === 0 ? (
                  <p className="text-gray-400 text-sm">No files uploaded</p>
                ) : (
                  <div className="space-y-1">
                    {files.map((file, idx) => {
                      const pathParts = file.path.split(/[/\\]/);
                      const indent = (pathParts.length - 1) * 12;
                      const isInFolder = pathParts.length > 1;
                      
                      return (
                        <div 
                          key={idx} 
                          className="bg-gray-700 rounded p-2 flex justify-between items-center hover:bg-gray-600 transition"
                          style={{ marginLeft: `${indent}px` }}
                        >
                          <div className="flex-1 min-w-0 flex items-start gap-2">
                            <span className="text-gray-400 text-xs mt-0.5">
                              {isInFolder ? '└─' : ''}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate" title={file.path}>
                                {file.name}
                              </p>
                              {isInFolder && (
                                <p className="text-gray-500 text-xs truncate">
                                  {pathParts.slice(0, -1).join('/')}
                                </p>
                              )}
                              <p className="text-gray-400 text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteFile(file.path)}
                            className="ml-2 text-red-400 hover:text-red-300 transition flex-shrink-0"
                            title="Delete file"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-800 bg-opacity-80 backdrop-blur-sm">
            
            {/* Messages */}
           
<div className="flex-1 overflow-y-auto p-6 space-y-4">
  {messages.length === 0 ? (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <h3 className="text-2xl font-bold mb-2">Ask me anything!</h3>
        <p>Upload files and start chatting about your codebase</p>
      </div>
    </div>
  ) : (
    messages.map((msg, idx) => (
      <div 
        key={idx} 
        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`rounded-lg p-4 ${
            msg.type === 'user' 
              ? 'bg-blue-600 text-white max-w-[70%]' 
              : msg.type === 'error' 
              ? 'bg-red-600 text-white max-w-[70%]' 
              : 'bg-gray-700 text-white max-w-[80%]'
          }`}
        >
          {/* Show "Thinking..." only if message is empty and loading */}
          {msg.type === 'assistant' && msg.content === '' && isLoading ? (
            <p className="animate-pulse">Thinking...</p>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-xs text-gray-300 mb-2">
                    Sources ({msg.contextUsed}):
                  </p>
                  <div className="space-y-1">
                    {msg.sources.map((src, i) => (
                      <p key={i} className="text-xs text-gray-400">
                        📄 {src.filename} ({(src.relevance * 100).toFixed(0)}%)
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    ))
  )}
  <div ref={chatEndRef} />
</div>

            {/* Input Area */}
            <div className="p-4 bg-gray-900 bg-opacity-90 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question about your files..."
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition font-semibold"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;