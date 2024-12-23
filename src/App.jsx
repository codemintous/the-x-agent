import React from "react";
import "./App.css";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./integrals/Home";
import ChatBot from "./integrals/ChatBot";
import Flashcards from "./integrals/Flashcards";
import MultiHighlight from "./integrals/MultiHighlight";
import Summary from "./integrals/Summary";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> 
        <Route path="/summary" element={<Summary />} />
        <Route path="/chatbot" element={<ChatBot />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/multiHighlight" element={<MultiHighlight />} />
        
      </Routes>
    </Router>
  );
}

export default App;