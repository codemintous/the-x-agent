import React, { useState, useEffect } from 'react';
import config from '../config/config';
import commandsList from '../data/commands.json';

const memecoinTokens = [
  "$DOGE", "$SHIB", "$PEPE", "$FLOKI", "$BabyDoge", "$LEASH",
  "$AKITA", "$KISHU", "$HOGE", "$DOBO", "$POPCAT"
];

const BuySell = () => {
  const [twitterText, setTwitterText] = useState('');
  const [matchedToken, setMatchedToken] = useState('POP CAT'); // Default static value

  useEffect(() => {
    const messageListener = (message) => {
      console.log('address received from background.js:', message);

      if (message.action === 'SEND_WARPCAST_TEXT') {
        setTwitterText(message.data);
        console.log('Twitter text received:', message.data);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  useEffect(() => {
    // Filter tokens from memecoinTokens based on the twitterText
    const tokenFound = memecoinTokens.find((token) => twitterText.includes(token));
    if (tokenFound) {
      setMatchedToken(tokenFound); // Update matched token
    } else {
      setMatchedToken('POP CAT'); // Fallback to default
    }
  }, [twitterText]);

  return (
    <div className="w-full bg-bg-color text-white p-4 flex flex-col h-[760px]">
      {/* Chat title */}
      <div className="flex justify-center font-bold text-lg mb-4">Token</div>

      {/* Input Box */}
      <div className="flex w-full mb-4">
        <input
          type="text"
          className="flex-grow w-full p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color"
          placeholder="Enter text and press Enter"
          value={twitterText}
          onChange={(e) => setTwitterText(e.target.value)} // Track the input value
        />
      </div>

      {/* Static UI Section */}
      <div className="flex flex-col bg-bg-color p-4 rounded-lg">
        {/* Header Section */}
        <div className="flex flex-col items-start">
          <div className="text-sm text-[#A3A3A3]">7Gcihg...VmW2hr</div>
          <div className="text-2xl font-bold">{matchedToken}</div>
        </div>

        {/* Price Section */}
        <div className="flex items-center gap-2 mb-2">
          <div className="text-lg font-bold">$689.26M</div>
          <div className="text-sm text-red-500">-0.49% Today</div>
        </div>

        <div className="w-full h-40 bg-[#262626] mb-4 rounded-lg flex items-center justify-center">
          {/* Placeholder for Graph */}
          <p className=" text-gray-400 ">Graph Placeholder</p>
        </div>

        {/* Posts Section */}
        <div className="flex flex-col bg-[#262626] p-4 rounded-lg mb-4">
          <div className="text-sm font-medium mb-2">whalewatchalert • 16m</div>
          <div className="text-sm">
            A <span className="text-[#1D9BF0]">{matchedToken}</span> whale just bought
            <span className="text-[#FFD700]"> $11.77K </span>
            of <span className="text-[#FFD700]">$APPLE</span> at $25.44M MC
          </div>
        </div>

        {/* Footer Section */}
        <div className="flex flex-col gap-4 items-center">
          {/* Buy/Sell and Input Row */}
          <div className="flex flex-row items-center gap-2 w-full">
            {/* BUY Button */}
            <button className="bg-btn-color text-sm font-bold text-white px-4 py-2 rounded-md flex-grow basis-1/4 max-w-[120px]">
              BUY
            </button>

            {/* SELL Button */}
            <button className="bg-[#333333] text-sm font-bold text-white px-4 py-2 rounded-md flex-grow basis-1/4 max-w-[120px] hover:bg-btn-color">
              SELL
            </button>

            {/* Input Field */}
            <input
              type="number"
              className="bg-[#1C1C1C] text-white p-2 rounded-md flex-grow basis-1/2 text-center max-w-[180px] border border-[#555555] placeholder-gray-500"
              placeholder="0"
            />
          </div>

          {/* Price Buttons Row */}
          <div className="grid grid-cols-4 gap-2 w-full">
            <div className="bg-[#333333] text-sm text-[#A3A3A3] px-4 py-2 rounded-md flex items-center justify-center">
              0.25$
            </div>
            <div className="bg-[#333333] text-sm text-[#A3A3A3] px-4 py-2 rounded-md flex items-center justify-center">
              0.5$
            </div>
            <div className="bg-[#333333] text-sm text-[#A3A3A3] px-4 py-2 rounded-md flex items-center justify-center">
              1$
            </div>
            <div className="bg-[#333333] text-sm text-[#A3A3A3] px-4 py-2 rounded-md flex items-center justify-center">
              5$
            </div>
          </div>

          {/* Submit Button */}
          <button className="bg-btn-color text-sm font-bold text-white px-4 py-2 rounded-md w-full">
            SUBMIT
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuySell;
