import React from "react";
import { Routes, Route } from "react-router-dom";
import BG_VID from "./assets/BG_VID.mp4";
import "./App.css";
import ThreeDCardDemo from "./components/Modal";
import Chatbot from "./Chatbot";

function Home() {
  return (
    <>
      {/* Background Video - Fixed fullscreen */}
      <div className="bg-video-wrap">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="bg-video"
          onLoadedData={() => console.log("Video loaded successfully")}
          onError={(e) => console.log("Video error:", e)}
        >
          <source src={BG_VID} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Content centered on screen */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <ThreeDCardDemo />
      </div>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chatbot" element={<Chatbot />} />
    </Routes>
  );
}

export default App;
