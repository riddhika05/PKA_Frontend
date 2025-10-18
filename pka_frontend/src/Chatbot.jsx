import React from 'react'
import "./App.css"
import BG_VID from "./assets/BG_VID.mp4";
const Chatbot = () => {
  return (
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
  )
}

export default Chatbot
