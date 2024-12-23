import { getColorClass, sendMsg, saveStateToStorage, loadStateFromStorage } from "../utils";
import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { PlusCircleIcon, ExclamationIcon} from '@heroicons/react/outline';

const MultiHighlight = () => {
  const initialColors = [
    "yellow",
    "green",
    "cyan",
    "gray",
    "orange",
    "pink",
    "blue",
    "purple",
    "rose",
    "teal",
  ];

  const [inputValue, setInputValue] = useState("");
  const [words, setWords] = useState([]);
  const [availableColors, setAvailableColors] = useState(initialColors);
  
  // To preserve state of extension during session
  useEffect(() => {
    loadStateFromStorage('highlightedWords', (savedWords) => {
      if (savedWords) setWords(savedWords);
    });
    loadStateFromStorage('availableColors', (savedColors) => {
      if (savedColors) setAvailableColors(savedColors);
    });
  }, []);

  useEffect(() => {
    saveStateToStorage('highlightedWords', words);
    saveStateToStorage('availableColors', availableColors);
  }, [words, availableColors]);

  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  useEffect(() => {
    if (error) {
      setShowPopup(true);
      const timer = setTimeout(() => {
        setShowPopup(false);
        setError("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error]);


  const addWord = () => {
    if (words.some((word) => word.text.toLowerCase() === inputValue.trim().toLowerCase())) {
      setError("This Word is already being highlighted!");
    } else if (availableColors.length <= 0) {
      setError("Sorry, you can only add 10 words at once!");
    } else if (inputValue.trim() !== "") {
      const newColor =
        availableColors[Math.floor(Math.random() * availableColors.length)];
      const newWords = [...words, { text: inputValue.trim(), color: newColor }];
      const newColors = availableColors.filter((color) => color !== newColor);

      setWords(newWords);
      setAvailableColors(newColors);
      setInputValue("");
      setError("");
      sendMsg(`highlight ${inputValue.trim()} ${newColor}`);
    }
  };

  const removeWord = (wordToRemove) => {
    const newWords = words.filter((word) => word.text !== wordToRemove.text);
    const newColors = [...availableColors, wordToRemove.color];

    setWords(newWords);
    setAvailableColors(newColors);
    sendMsg(`unhighlight ${wordToRemove.color}`);
  };

  return (
    <>
      {/* <Navbar /> */}

      <div className="w-full h-full bg-bg-color p-3 flex flex-col">
       

        <div className="flex w-full mt-1 mb-4 rounded border border-transparent focus-within:border-[#1D9BF0]">
          <input
            type="text"
            placeholder="Please enter the word to highlight.."
            className="flex-grow p-2 bg-input-color text-white focus:outline-none"
            value={inputValue}
            onChange={(e) => {
                setInputValue(e.target.value);
                setError(""); 
              }}  
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                    addWord();
                }
              }}
          />
          <button
            className="p-2 bg-input-color text-white flex items-center"
            onClick={addWord}
          >
            <PlusCircleIcon className='h-5 w-5'/>
          </button>
        </div>

        <div className="overflow-y-auto flex flex-wrap">
          {words.map((word) => (
            <span
              key={word.text}
              className={`m-1 p-1 font-bold font-Quicksand rounded ${getColorClass(word.color)} flex items-center justify-center cursor-pointer`}
              onClick={() => removeWord(word)}>
              {word.text}
            </span>
          ))}
        </div>

        <div className="italic mb-1 mt-1 fixed bottom-20 left-0 right-0 mx-auto text-white text-center font-bold text-xs">Click on word to unhighlight</div>

        {/* {showPopup && (
          <div className="absolute font-Quicksand top-6 text-xs left-1/2 transform -translate-x-1/2 bg-red-600 text-white p-2 text-center font-bold flex items-center">
            {error}
          </div>
        )} */}

        {showPopup && (
        <div className="fixed top-6 left-0 right-0 mx-auto w-3/4 bg-red-600 text-white p-1 text-center font-bold text-xs">
            <ExclamationIcon className='h-4 w-4 inline-block mr-2'/> {error}
        </div>
        )}

      </div>
    </>
  );
};

export default MultiHighlight;