import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chatbot from "./Chatbot";
import BG_VID from "./assets/BG_VID.mp4";
import "./App.css";
function App() {
  return (
    <>
      <div className="bg-video-wrap">
        <video autoPlay loop muted playsInline className="bg-video">
          <source src={BG_VID} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </>
  );
}

export default App;
