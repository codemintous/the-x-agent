import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/navbar";
import Flashcard from "../components/flashcard";
import { ThreeDots } from "react-loader-spinner";
import { getWebPageContent } from "../utils";


const Flashcards = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchFlashcards = async () => {
      const content = await getWebPageContent();
      const data = {
        content: content
      };
    
      axios.post('https://sentiplex-api.potp.xyz/flashcards', data)
        .then(response => {
          setFlashcards(response.data);  // With axios, the JSON is already parsed
        })
        .catch(error => {
          window.alert('Error:', error);
        });
    };
    fetchFlashcards();
  }, []);

  const nextFlashcard = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const prevFlashcard = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <>
      {/* <Navbar/> */}
      <div className="w-full h-full bg-bg-color p-3 flex justify-center items-center">
        {flashcards.length > 0 ? (
          <>
            <Flashcard 
              text={flashcards[currentIndex]} 
              progress={(currentIndex + 1) / flashcards.length} 
              onNext={nextFlashcard} 
              onPrev={prevFlashcard} 
            />
          </>
        ) : (
          <div className="flex justify-center items-center">
                <ThreeDots width = "40" height = "40" color = '#ffffff'/>
          </div>
        )}
      </div>
    </>
  );
};

export default Flashcards;
