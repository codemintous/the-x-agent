import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import { ArrowCircleDownIcon,XIcon } from '@heroicons/react/outline';
import TextDisplay from '../components/TextDisplay';
import { getWebPageContent, saveStateToStorage, loadStateFromStorage } from '../utils';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';

const ChatBot = () => {
  const [inputValue, setInputValue] = useState(""); // To store user input
  const [responseData, setResponseData] = useState(""); // To store response data
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [isSubmitted, setSubmitted] = useState(false);
  const [isLoadedFromStorage, setLoadedFromStorage] = useState(false);

  // To preserve state of extension during session
  useEffect(() => {
    loadStateFromStorage('chatInputValue', (savedInputVal) => {
      if (savedInputVal) setInputValue(savedInputVal);
    });
    loadStateFromStorage('chatResponseValue', (savedResponseVal) => {
      if (savedResponseVal){
        setResponseData(savedResponseVal);
        setLoadedFromStorage(true);
      }  
    });
    loadStateFromStorage('chatWasSubmitted', (chatWasSubmitted) => {
      if (chatWasSubmitted) setSubmitted(chatWasSubmitted);
    });
  }, []);

  useEffect(() => {
    saveStateToStorage('chatInputValue', inputValue);
    saveStateToStorage('chatResponseValue', responseData);
    saveStateToStorage('chatWasSubmitted', isSubmitted);
  }, [inputValue, responseData, isSubmitted]);

  const handleUserInput = async () => {
    setLoadedFromStorage(false);
    setSubmitted(true);
    setIsLoading(true);

    const content = await getWebPageContent();
    const data = {
      content: content,
      question: inputValue
    };
  
    axios.post('https://sentiplex-api.potp.xyz/answer', data)
      .then(response => {
        setResponseData(response.data);  // With axios, the JSON is already parsed
        setIsLoading(false);
      })
      .catch(error => {
        window.alert('Error:', error);
        setIsLoading(false);
      });
  };

  return (
    <>
      {/* <Navbar /> */}
      <div className="w-full h-full bg-bg-color p-3 flex flex-col">
        <div className="flex w-full mt-1 mb-4 relative border rounded border-transparent focus-within:border-[#1D9BF0] ">
          <textarea
            placeholder="Please enter your question.."
            className="flex-grow p-2  bg-input-color rounde-l text-white resize-none border-none focus:outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUserInput();
              }
            }}
          />
          <button
            className="absolute right-0 top-0 h-full p-2 rounded-r bg-input-color text-white font-extrabold text-xl"
            onClick={handleUserInput}
          >
            <ArrowCircleDownIcon className='h-5 w-5'/>
          </button>
        </div>
        
        {
          isSubmitted && (
            isLoading ? (
              <div className="flex justify-center items-center">
                <ThreeDots width = "40" height = "40" color = '#ffffff'/>
              </div>
            ) : (
              <TextDisplay content={responseData} animate={!isLoadedFromStorage} />
            )
          )
        }
      </div>
    </>
  );
}

export default ChatBot;
