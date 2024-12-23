import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ThreeDots } from 'react-loader-spinner';

const Swap = () => {
  const [responseMessage, setResponseMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleConnectWallet();

    const messageListener = (message) => {
      console.log("Received message from background.js:", message);

      if (message.action === 'SEND_TWITTER_USERNAME') {
        // Setting userName and address from the message data
        setUserName(message.user || '');
        setAddress(message.accountAddress || '');
        console.log("Twitter username received:", message.user);
        console.log("Account address received:", message.accountAddress);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

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

  // Function to handle API call
  const handleApiCall = async () => {
    try {
      setLoading(true);
      const response = await axios.post('https://magicmeme-backend.potp.xyz/memehub/projectContract', {
        chainId: "56",
        twitter: userName,
        amount: amount, // should be in the required format for API
        userAddress: address,
      });
      setResponseMessage('Swap successful!');
       console.log('Swap successful!');
    } catch (error) {
      console.error('Error during swap:', error);
      setResponseMessage('Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="w-full h-full bg-bg-color text-white p-3 flex justify-center flex-col">
        <p className="flex w-full mt-1 mb-4 justify-center font-bold text-lg">
          Swap 
        </p>

        <div className="w-full h-full overflow-y-auto custom-scrollbar">
          <div className="bg-tab-color p-4 rounded-lg shadow-md text-center">
            <div className="flex flex-col gap-4 text-left">
              <label className="text-sm">
                Username:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </label>

              <label className="text-sm">
                Account Address:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>

              <label className="text-sm">
                Amount:
                <input
                  type="number"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
            </div>
            <div className="flex justify-center mt-4">
              <button
               onClick={handleApiCall}
                disabled={!(userName && address && amount) || loading} // Disable if fields are empty or loading
                className={`py-3 px-4 rounded-lg transition duration-200 ${!(userName && address && amount) || loading
                  ? "bg-btn-color cursor-not-allowed" // Disabled style
                  : "bg-btn-color hover:bg-btn-hover-color" // Enabled style
                  }`}
              >
                Swap
              </button>
            </div>
          </div>
        </div>

        {/* {(userName && address && amount) && (
          <div className="flex justify-center">
            <button
              onClick={handleApiCall}
              disabled={loading}
              className="px-3 py-2 mt-2 bg-btn-color rounded-lg"
            >
              {loading ? <ThreeDots color="#fff" height={20} width={20} /> : 'Swap'}
            </button>
          </div>
        )} */}

        {responseMessage && (
          <div className="mt-4 p-2 text-center bg-white text-black rounded">
            {responseMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default Swap;
