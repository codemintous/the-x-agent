import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';
import config from '../config/config';

const Settings = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(''); // Store success/failure messages
  const [memeInfo, setMemeInfo] = useState('');
  const [memeName, setMemeName] = useState(''); // Editable
  const [desc, setDesc] = useState(''); // Editable
  const [symbol, setSymbol] = useState(''); // Editable
  const [amount, setAmount] = useState(''); // Editable
  const [logoUrl, setLogoUrl] = useState('');
  const [twitterText, setTwitterText] = useState('');

  useEffect(() => {
    handleConnectWallet();
    const messageListener = (message) => {
      console.log("Received message from background.js:", message);

      if (message.action === 'SEND_WARPCAST_TEXT') {
        setTwitterText(message.data);
        console.log("Twitter text received:", message.data);
        handleApiCall(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleApiCall = async (twitterText) => {
    try {
      setLoading(true);
      console.log("Making API call with twitterText:", twitterText);
      const response = await axios.post(
        `${config.BASE_URL}/memehub/getNameAndDescription`,
        // `https://magicmeme-backend.potp.xyz/memehub/getNameAndDescription`,
        { topic: twitterText }
      );

      const data = response.data.data;
      setMemeInfo(data);
      setMemeName(data.name);
      setDesc(data.description);
      setSymbol(data.symbol);
      await handleLogoApiCall(data.name, data.description);
    } catch (error) {
      console.error('Error during API call:', error);
      // setResponseMessage('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoApiCall = async (Name, Description) => {
    try {
      const logoResponse = await axios.post(
        `${config.BASE_URL}/memehub/getLogo`,
        // `https://magicmeme-backend.potp.xyz/memehub/getLogo`,
        {
          name: Name,
          description: Description
        }
      );

      const logoData = logoResponse.data.data;
      setLogoUrl(logoData.image);
    } catch (error) {
      console.error('Error during logo API call:', error);
      // setResponseMessage('Error getting logo');
    }
  };

  const handleConnectWallet = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'CONNECT_WALLET' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error:", chrome.runtime.lastError.message);
        } else {
          console.log("Response from content.js:", response);
        }
      });
    });
  };
  const handleMint = () => {
    console.log("Sending mint action to content.js with memeName, symbol, and amount");
    // const parsedAmount = parseInt(amount, 10);
    console.log("amount ======================", amount);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "mint",
          memeName,
          symbol,
          amount,
          desc,
          logoUrl
        },
        (response) => {
          console.log("Response received from content.js:", response);

          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError.message);
            setResponseMessage(`Error: ${chrome.runtime.lastError.message}`);
          } else {
            if (response) {
              if (response.status === 'success') {
                console.log('Minting successful:', response); // response.data
                setResponseMessage(`Minting successful! Transaction Hash: ${response.data.transactionHash}`);
              } else if (response.status === 'error') {
                console.error('Minting failed:', response.error);
                setResponseMessage(`Minting failed: ${response.error}`);
              }
            } else {
              console.error("No response received.");
              setResponseMessage('No response received from content.js.');
            }
          }
        }
      );
    });
  };


  return (
    <>
      <div className="w-full h-full bg-bg-color text-white p-3 flex flex-col">
        <div className="flex w-full mb-4">
          <input
            type="text"
            className="flex-grow w-full p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color"
            placeholder="Enter text and press Enter"
            value={twitterText}
            onChange={(e) => setTwitterText(e.target.value)} // Track the input value
          />
        </div>

        <div className="w-full h-full overflow-y-auto custom-scrollbar">
          <div className="bg-tab-color p-6 rounded-lg shadow-md text-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center mb-4 bg-tab-color p-6 rounded-lg shadow-md h-36">
                {/* Loading Spinner */}
                <ThreeDots color="white" height={40} width={40} />
                {/* Informative Text */}
                <p className="mt-3 text-white text-sm">Logo will be generated...</p>
              </div>
            ) : logoUrl ? (
              <div className="flex justify-center mb-4 bg-tab-color p-6 rounded-lg shadow-md">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-28 w-28 object-cover rounded-full"
                />
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center mb-4 bg-tab-color p-6 rounded-lg shadow-md h-36 border-2 border-dashed border-gray-500">
                {/* Image Icon Placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {/* Placeholder Text */}
                <p className="mt-3 text-gray-500 text-sm">Logo will be displayed here</p>
              </div>
            )}


            {/* Form for editing meme details with labels */}
            <div className="flex flex-col gap-6 text-left">
              <label className="text-sm">
                Meme Name:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Meme Name"
                  value={memeName} // Automatically filled from API data
                  onChange={(e) => setMemeName(e.target.value)} // Editable
                />
              </label>

              <label className="text-sm">
                Symbol:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Symbol"
                  value={symbol} // Automatically filled from API data
                  onChange={(e) => setSymbol(e.target.value)} // Editable
                />
              </label>

              <label className="text-sm">
                Amount:
                <input
                  type="number"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Amount"
                  value={amount} // Editable
                  onChange={(e) => setAmount(e.target.value)} // Editable
                />
              </label>

              <label className="text-sm">
                Description:
                <textarea
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Description"
                  value={desc} // Automatically filled from API data
                  onChange={(e) => setDesc(e.target.value)} // Editable
                />
              </label>
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleMint}
                disabled={!(memeName && symbol && desc) || loading} // Disable if fields are empty or loading
                className={`py-3 px-4 rounded-lg transition duration-200 ${!(memeName && symbol && desc) || loading
                  ? "bg-btn-color cursor-not-allowed" // Disabled style
                  : "bg-btn-color hover:bg-btn-hover-color" // Enabled style
                  }`}
              >
                Mint Token
              </button>
            </div>
          </div>
        </div>

        {/* {(memeName && desc && symbol) && (
          <div className='flex justify-center mt-4'>
            <button onClick={handleMint} disabled={loading} className='py-3 px-4 bg-btn-color rounded-lg hover:bg-btn-hover-color transition duration-200'>
            Mint Token
            </button>
          </div>
        )} */}



        {/* Conditional rendering of the success or failure message */}
        {responseMessage && (
          <div className="mt-4 p-3 text-center bg-white text-black rounded shadow-md">
            {responseMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;

