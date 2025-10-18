import { useState } from 'react'
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Chatbot from './Chatbot'
function App() {
   
const navigate=useNavigate();
  return (
    <>
        <BrowserRouter>
         <Routes>
          <Route path='/chatbot' element="Chatbot">

          </Route>
         </Routes>
        </BrowserRouter>
    </>
  )
}

export default App
