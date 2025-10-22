import React, { useState, useEffect, useRef } from "react";
import File from "./assets/cat_eating_file.png";
import Folder from "./assets/cat_eating_folder.png";
import Reindex from "./assets/cat_playing.png";
import Clean from "./assets/cat_brooming.png";
import Delete from "./assets/cat_throwing_file.png";
import BG_VID from "./assets/BG_VID.mp4";
import Hungry from "./assets/Hungry.gif";
import Clean_Chat from "./assets/delete_chat.png";
// Constant for localStorage key
const LOCAL_STORAGE_KEY = "mistyChatHistory";

const Chatbot = () => {
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // File management
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState(null);

  // Chat interface
  // Initialize messages state by attempting to load from localStorage
  const [messages, setMessages] = useState(() => {
    try {
      const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedMessages ? JSON.parse(storedMessages) : [];
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
      return [];
    }
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Effect to save messages to localStorage whenever the messages state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  // Effect for alert modal timeout
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

  // Effect to scroll to the end of the chat
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
      const response = await fetch("http://127.0.0.1:8000/list_files");
      const data = await response.json();
      if (response.ok) {
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/collection_stats");
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // UPLOAD INDIVIDUAL FILES
  const handleAddFiles = () => {
    const fileInput = document.getElementById("fileInput");
    fileInput.click();
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://127.0.0.1:8000/upload_and_index", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(
          `Successfully uploaded ${files.length} file(s)`,
          "success"
        );
        event.target.value = "";
        fetchStats();
      } else {
        const errorMessage =
          data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // UPLOAD FOLDERS
  const handleAddFolders = () => {
    const folderInput = document.getElementById("folderInput");
    folderInput.click();
  };

  const handleFolderSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      const formData = new FormData();
      const filePaths = [];

      files.forEach((file) => {
        formData.append("files", file);
        filePaths.push(file.webkitRelativePath || file.name);
      });

      formData.append("file_paths", JSON.stringify(filePaths));

      const response = await fetch("http://127.0.0.1:8000/upload_and_index", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(
          `Successfully uploaded folder with ${files.length} file(s)`,
          "success"
        );
        event.target.value = "";
        fetchStats();
      } else {
        const errorMessage =
          data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // RE-INDEX ALL FILES
  const handleReindexAll = async () => {
    if (
      !window.confirm("Re-index all files in workspace? This may take a while.")
    )
      return;

    try {
      const response = await fetch("http://127.0.0.1:8000/index_workspace", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert(data.message, "success");
        fetchStats();
      } else {
        const errorMessage =
          data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // CLEAN WORKSPACE (RESET COLLECTION)
  const handleCleanWorkspace = async () => {
    if (
      !window.confirm(
        "⚠️ WARNING: This will delete ALL indexed data! Are you sure?"
      )
    )
      return;

    try {
      const response = await fetch("http://127.0.0.1:8000/reset_collection", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        displayAlert("Workspace cleaned successfully!", "success");
        fetchStats();
        setMessages([]); // Clear chat on workspace clean
      } else {
        const errorMessage =
          data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // DELETE FILE
  const handleDeleteFile = async (filePath) => {
    if (!window.confirm(`Delete ${filePath}?`)) return;

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/delete_file?file_path=${encodeURIComponent(
          filePath
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        displayAlert(`Deleted ${filePath}`, "success");
        fetchFiles();
        fetchStats();
      } else {
        const errorMessage =
          data.detail || data.message || `HTTP Error ${response.status}`;
        displayAlert(errorMessage, "error");
      }
    } catch (error) {
      displayAlert("Network Error: Is the server running?", "error");
    }
  };

  // Open delete modal
  const handleOpenDeleteModal = () => {
    fetchFiles();
    setShowDeleteModal(true);
  };

  // NEW FUNCTION: Clear Chat
  const handleClearChat = () => {
    if (
      !window.confirm("Are you sure you want to clear the entire chat history?")
    )
      return;

    setMessages([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      displayAlert("Chat history cleared successfully!", "success");
    } catch (error) {
      console.error("Error clearing chat history from localStorage:", error);
      displayAlert("Failed to clear chat history from storage.", "error");
    }
  };

  // SEND MESSAGE WITH STREAMING
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        type: "assistant",
        content: "",
        sources: [],
        contextUsed: 0,
      },
    ]);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/ask?question=${encodeURIComponent(
          userMessage
        )}&stream=true`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const data = JSON.parse(jsonStr);

              if (data.content) {
                accumulatedContent += data.content;

                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex].type === "assistant") {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: accumulatedContent,
                    };
                  }
                  return newMessages;
                });
              }

              if (data.sources) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  if (newMessages[lastIndex].type === "assistant") {
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      sources: data.sources,
                      contextUsed: data.context_used || 0,
                    };
                  }
                  return newMessages;
                });
              }

              if (data.error) {
                setMessages((prev) => [
                  ...prev,
                  {
                    type: "error",
                    content: `Error: ${data.error}`,
                  },
                ]);
                break;
              }
            } catch (e) {
              console.error("JSON parse error:", e, "Raw:", jsonStr);
            }
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages.pop();
        return [
          ...newMessages,
          {
            type: "error",
            content: `Network Error: ${error.message}`,
          },
        ];
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
        fetchStats();
      } else {
        const errorMessage =
          data.detail || data.message || `HTTP Error ${response.status}`;
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
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zm-3.293-9.293a1 1 0 011.414-1.414L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4z",
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-500",
      icon: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
    },
  };
  const config = alertConfig[alertType];

  return (
    <>
      {/* Background Video */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={BG_VID} type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        {/* Hidden Inputs */}
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          id="folderInput"
          type="file"
          multiple
          webkitdirectory="true"
          directory=""
          onChange={handleFolderSelect}
          className="hidden"
        />

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
            <div
              className={`w-full max-w-lg mx-4 p-5 rounded-lg border-l-4 shadow-xl ${config.bg} ${config.border} transform transition-all duration-300 pointer-events-auto`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 pt-1">
                  <svg
                    className={`h-6 w-6 ${config.text}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d={config.icon}
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-medium ${config.text}`}>
                    {alertType === "success" ? "Success" : "Error"}
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
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Files Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-teal-900/30">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-teal-100 font-bold text-xl">
                  Delete Files
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="text-teal-400 hover:text-teal-300 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-900/60 rounded-lg p-4 border border-teal-900/20">
                {files.length === 0 ? (
                  <p className="text-teal-300/60 text-center py-8">
                    No files in workspace
                  </p>
                ) : (
                  <div className="space-y-2">
                    {files.map((file, idx) => {
                      const pathParts = file.path.split(/[/\\]/);
                      const indent = (pathParts.length - 1) * 12;
                      const isInFolder = pathParts.length > 1;

                      return (
                        <div
                          key={idx}
                          className="bg-slate-800/80 rounded p-3 flex justify-between items-center hover:bg-slate-700/80 transition border border-teal-900/20"
                          style={{ marginLeft: `${indent}px` }}
                        >
                          <div className="flex-1 min-w-0 flex items-start gap-2">
                            <span className="text-teal-500/60 text-xs mt-1">
                              {isInFolder ? "└─" : "📄"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-teal-100 text-sm truncate"
                                title={file.path}
                              >
                                {file.name}
                              </p>
                              {isInFolder && (
                                <p className="text-teal-400/50 text-xs truncate">
                                  {pathParts.slice(0, -1).join("/")}
                                </p>
                              )}
                              <p className="text-teal-400/60 text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              handleDeleteFile(file.path);
                              setShowDeleteModal(false);
                            }}
                            className="ml-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded transition text-sm flex-shrink-0 shadow-md"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Top Bar with Action Buttons */}
        {!showSetupModal && (
          <>
            <div className="flex gap-12 mb-4">
              <button
                onClick={handleAddFiles}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg transition font-small flex items-center gap-2 shadow-lg"
              >
                <img src={File} className="w-10 h-10 transform scale-150 hover:scale-110"></img>Add Files
              </button>
              <button
                onClick={handleAddFolders}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg"
              >
                <img src={Folder} className="w-10 h-10 transform scale-150 hover:scale-110"></img> Add Folder
              </button>
              <button
                onClick={handleOpenDeleteModal}
                className="bg-amber-300 hover:bg-amber-700 text-white px-5 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg"
              >
                <img src={Delete} className="w-10 h-10 transform scale-150 hover:scale-110"></img> Delete Files
              </button>
              <button
                onClick={handleReindexAll}
                className="bg-purple-700 hover:bg-violet-700 text-white px-5 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg"
              >
                <img src={Reindex} className="w-10 h-10 transform scale-150 hover:scale-110"></img> Rebuild Index
              </button>
              <button
                onClick={handleCleanWorkspace}
                className="bg-rose-700 hover:bg-rose-800 text-white px-5 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg"
              >
                <img src={Clean} className="w-10 h-10 transform scale-150 hover:scale-110"></img> Clean All
              </button>
              {/* NEW BUTTON: Clear Chat */}
              <button
                onClick={handleClearChat}
                className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg"
              >
                <img src={Clean_Chat} className="w-12 h-13 transform scale-125 hover:scale-110"></img>
                Clear Chat
              </button>
            </div>
            <div className="bg-slate-900 bg-opacity-85 backdrop-blur-md border-b border-teal-900/30 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={Hungry} className="w-10 h-10 rounded-full"></img>
                  <h1 className="text-teal-100 font-bold text-2xl">Misty</h1>
                  {stats && (
                    <div className="text-teal-300/70 text-sm flex gap-4">
                      <span>📦 {stats.total_chunks} chunks</span>
                      <span>📄 {stats.unique_files} files</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/70 backdrop-blur-md">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-teal-200/80">
                      <h3 className="text-3xl font-bold mb-2">
                        💬 Ask me anything!
                      </h3>
                      <p className="text-lg text-teal-300/60">
                        Want to talk about your files?
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.type === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-lg p-4 text-left ${
                          msg.type === "user"
                            ? "bg-teal-600/90 text-white max-w-[70%] shadow-lg"
                            : msg.type === "error"
                            ? "bg-rose-600/90 text-white max-w-[70%] shadow-lg"
                            : "bg-slate-800/90 text-teal-50 max-w-[80%] shadow-lg border border-teal-900/30"
                        }`}
                      >
                        {msg.type === "assistant" &&
                        msg.content === "" &&
                        isLoading ? (
                          <p className="animate-pulse text-teal-300">
                            Thinking...
                          </p>
                        ) : (
                          <>
                            <div className="prose prose-invert prose-sm max-w-none">
                              <div className="whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content.split("\n").map((line, i) => {
                                  // Code blocks
                                  if (line.trim().startsWith("```")) {
                                    return (
                                      <div
                                        key={i}
                                        className="bg-slate-900/50 p-3 rounded my-2 font-mono text-xs overflow-x-auto border border-teal-900/30"
                                      >
                                        {line.replace(/```/g, "")}
                                      </div>
                                    );
                                  }
                                  // Headers
                                  if (line.startsWith("###")) {
                                    return (
                                      <h3
                                        key={i}
                                        className="text-lg font-bold text-teal-300 mt-4 mb-2"
                                      >
                                        {line.replace(/###/g, "").trim()}
                                      </h3>
                                    );
                                  }
                                  if (line.startsWith("##")) {
                                    return (
                                      <h2
                                        key={i}
                                        className="text-xl font-bold text-teal-200 mt-4 mb-2"
                                      >
                                        {line.replace(/##/g, "").trim()}
                                      </h2>
                                    );
                                  }
                                  if (line.startsWith("#")) {
                                    return (
                                      <h1
                                        key={i}
                                        className="text-2xl font-bold text-teal-100 mt-4 mb-2"
                                      >
                                        {line.replace(/#/g, "").trim()}
                                      </h1>
                                    );
                                  }
                                  // Bullet points
                                  if (
                                    line.trim().startsWith("- ") ||
                                    line.trim().startsWith("* ")
                                  ) {
                                    return (
                                      <li
                                        key={i}
                                        className="ml-4 text-teal-100"
                                      >
                                        {line.replace(/^[\s-*]+/, "")}
                                      </li>
                                    );
                                  }
                                  // Bold text
                                  if (line.includes("**")) {
                                    const parts = line.split("**");
                                    return (
                                      <p key={i} className="my-2">
                                        {parts.map((part, j) =>
                                          j % 2 === 1 ? (
                                            <strong
                                              key={j}
                                              className="font-bold text-teal-200"
                                            >
                                              {part}
                                            </strong>
                                          ) : (
                                            part
                                          )
                                        )}
                                      </p>
                                    );
                                  }
                                  // Inline code
                                  if (
                                    line.includes("`") &&
                                    !line.startsWith("```")
                                  ) {
                                    const parts = line.split("`");
                                    return (
                                      <p key={i} className="my-2">
                                        {parts.map((part, j) =>
                                          j % 2 === 1 ? (
                                            <code
                                              key={j}
                                              className="bg-slate-800/50 px-1 py-0.5 rounded text-teal-300 font-mono text-xs"
                                            >
                                              {part}
                                            </code>
                                          ) : (
                                            part
                                          )
                                        )}
                                      </p>
                                    );
                                  }
                                  // Checkboxes
                                  if (
                                    line.trim().startsWith("- [ ]") ||
                                    line.trim().startsWith("- [x]")
                                  ) {
                                    const checked = line.includes("[x]");
                                    return (
                                      <div
                                        key={i}
                                        className="flex items-start gap-2 my-2"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          readOnly
                                          className="mt-1"
                                        />
                                        <span className="text-teal-100">
                                          {line
                                            .replace(/^[\s-]*\[[x\s]\]/, "")
                                            .trim()}
                                        </span>
                                      </div>
                                    );
                                  }
                                  // Regular paragraphs
                                  return line.trim() ? (
                                    <p key={i} className="my-2 text-teal-50">
                                      {line}
                                    </p>
                                  ) : (
                                    <br key={i} />
                                  );
                                })}
                              </div>
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-teal-800/50">
                                <p className="text-xs text-teal-300 mb-2">
                                  Sources ({msg.contextUsed}):
                                </p>
                                <div className="space-y-1">
                                  {msg.sources.map((src, i) => (
                                    <p
                                      key={i}
                                      className="text-xs text-teal-400/70"
                                    >
                                      📄 {src.filename} (
                                      {(src.relevance * 100).toFixed(0)}%)
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
              <div className="p-6 bg-slate-900/85 backdrop-blur-md border-t border-teal-900/30">
                <div className="flex gap-3 max-w-5xl mx-auto">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a question about your files..."
                    className="flex-1 bg-slate-800/80 text-teal-50 placeholder-teal-400/40 rounded-lg px-5 py-4 focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-base border border-teal-900/20"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-700 text-white px-8 py-4 rounded-lg transition font-semibold text-base shadow-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Chatbot;
