import React, { useState, useEffect } from 'react';
import Navbar from '../components/navbar';
import { ArrowCircleDownIcon } from '@heroicons/react/outline';
import TextDisplay from '../components/TextDisplay';
import { getWebPageContent, saveStateToStorage, loadStateFromStorage, speak } from '../utils';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';

const Summary = () => {
  const [inputValue, setInputValue] = useState(""); // To store user input
  const [responseData, setResponseData] = useState(""); // To store response data
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [isSubmitted, setSubmitted] = useState(false);
  const [isLoadedFromStorage, setLoadedFromStorage] = useState(false);

  // To preserve state of extension during session
  useEffect(() => {
    loadStateFromStorage('summaryInputValue', (summaryInputValue) => {
      if (summaryInputValue) setInputValue(summaryInputValue);
    });
    loadStateFromStorage('summaryResponseValue', (summaryResponseValue) => {
      if (summaryResponseValue) {
        setResponseData(summaryResponseValue);
        setLoadedFromStorage(true);
      } 
    });
    loadStateFromStorage('summaryWasSubmitted', (summaryWasSubmitted) => {
      if (summaryWasSubmitted) setSubmitted(summaryWasSubmitted);
    });
  }, []);

  useEffect(() => {
    saveStateToStorage('summaryInputValue', inputValue);
    saveStateToStorage('summaryResponseValue', responseData);
    saveStateToStorage('summaryWasSubmitted', isSubmitted);
  }, [inputValue, responseData, isSubmitted]);  

  const handleUserInput = async () => {
    setSubmitted(true);
    setIsLoading(true);
    setLoadedFromStorage(false);

    const content = await getWebPageContent();
    const data = {
      content: content,
      num_words: inputValue
    };
  
    axios.post('https://sentiplex-api.potp.xyz/summarize', data)
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
        <div className="flex w-full mt-1 mb-4 rounded border border-transparent focus-within:border-[#1D9BF0]">
          <input
            type='number'
            placeholder="Approximate number of words.."
            className="flex-grow p-2 bg-input-color text-white focus:outline-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleUserInput();
              }
            }}
          />
          <button
            className="p-2 bg-input-color text-white flex items-center"
            onClick={handleUserInput}
          >
            <ArrowCircleDownIcon className='h-5 w-5 focus:text-[#1D9BF0]'/>
          </button>
        </div>
        
        {
          isSubmitted && (
            isLoading ? (
              <div className="flex justify-center items-center">
                <ThreeDots width = "40" height = "40" color = '#1D9BF0'/>
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

export default Summary;
