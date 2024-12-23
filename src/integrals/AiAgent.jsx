import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config/config';

const AiAgent = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState(''); // Store success/failure messages
  const [agentName, setAgentName] = useState(''); // Editable
  const [instructions, setInstructions] = useState(''); // Editable
  const [model, setModel] = useState(''); // Editable
  const [tools, setTools] = useState(''); // Editable
  const [twitterText, setTwitterText] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  const [tokenName, setTokenName] = useState(''); // Editable
  const [threadId, setThreadId] = useState(''); // Editable
  const [tokenSupply, setTokenSupply] = useState(''); // Editable

  useEffect(() => {
    handleConnectWallet();
    // const messageListener = (message) => {
    //   console.log('address received from background.js:', message);

    //   if (message.action === 'SEND_WARPCAST_TEXT') {
    //     setTwitterText(message.data);
    //     console.log('Twitter text received:', message.data);
    //     // handleApiCall(message.data);
    //   }
    // //   if (message.action === 'WALLET_CONNECTED') {
    // //     setWalletAddress(message.data);
    // //     console.log('address received:', message.data);
    // //     // handleApiCall(message.data);
    // //   }
    // };

    // chrome.runtime.onMessage.addListener(messageListener);

    // return () => {
    //   chrome.runtime.onMessage.removeListener(messageListener);
    // };
  }, []);

  const handleConnectWallet = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'CONNECT_WALLET' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError.message);
        } else {
          console.log('Response from content.js:', response);
        }
      });
    });
  };
  const handleCreate = async () => {
    setLoading(true);
    setResponseMessage(''); // Clear previous messages
  
    // Prepare tools as an array from comma-separated input
    const toolsArray = tools.split(',').map((tool) => tool.trim()).filter(Boolean);
  
    try {
      // First API call to create the agent
      const agentResponse = await axios.post(`${config.BASE_URL}/api/assistants`, {
        name: agentName,
        instructions: instructions,
        tokenName: tokenName,
        tokenSupply: tokenSupply,
        model: model,
        tools: toolsArray.map((tool) => ({ type: tool })),
      });

      console.log("created agent", agentResponse.data.data._id)
  
      const agentId = agentResponse.data.data._id; // Assuming the response contains the _id of the agent
  
      // Log success of agent creation
      console.log('Agent created successfully:', agentId);
  
      // Second API call to create the thread using the agent's _id
      const threadResponse = await axios.post(`${config.BASE_URL}/api/threads/${agentId}`);
  
      // Log success of thread creation
      console.log('Thread created successfully:', threadResponse.data.data._id);
      setThreadId(threadResponse.data.data._id);
  
      // Set a success message combining both operations
      setResponseMessage(
        `Success: Agent and thread created successfully!`
      );
  
    } catch (error) {
      // Handle errors for both API calls
      console.error('Error creating agent or thread:', error);
      setResponseMessage(`Error: ${error.response?.data?.message || 'Failed to create agent or thread.'}`);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <div className="w-full h-full bg-bg-color text-white p-3 flex flex-col">
        {/* <div className="flex w-full mb-4">
          <input
            type="text"
            className="flex-grow w-full p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color"
            placeholder="Enter text and press Enter"
            value={twitterText}
            onChange={(e) => setTwitterText(e.target.value)} // Track the input value
          />
        </div> */}



        <div className="w-full h-full overflow-y-auto custom-scrollbar">
          <div className="bg-tab-color p-6 rounded-lg shadow-md text-center">
            <div className="flex flex-col gap-6 text-left">
              {/* <div><h2>walletAddress : {walletAddress}</h2></div> */}
              <label className="text-sm">
                Agent Name:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Agent name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </label>


              <label className="text-sm">
                Token Name:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="token name"
                  value={tokenName} // Automatically filled from API data
                  onChange={(e) => setTokenName(e.target.value)} // Editable
                />
              </label>

              <label className="text-sm">
                Token Supply:
                <input
                  type="number"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="token supply"
                  value={tokenSupply} // Editable
                  onChange={(e) => setTokenSupply(e.target.value)} // Editable
                />
              </label>


              <label className="text-sm">
                Model:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Model (e.g., gpt-4)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              </label>

              <label className="text-sm">
                Tools:
                <input
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Tools (comma-separated)"
                  value={tools}
                  onChange={(e) => setTools(e.target.value)}
                />
              </label>

              <label className="text-sm">
                Instructions:
                <textarea
                  type="text"
                  className="mt-1 p-3 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color w-full"
                  placeholder="Instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </label>


            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleCreate}
                disabled={!(agentName && instructions && model && tools && tokenName && tokenSupply) || loading} // Disable if fields are empty or loading
                className={`py-3 px-4 rounded-lg transition duration-200 ${!(agentName && instructions && model && tools && tokenName && tokenSupply) || loading
                    ? 'bg-btn-color cursor-not-allowed' // Disabled style
                    : 'bg-btn-color hover:bg-btn-hover-color' // Enabled style
                  }`}
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>

        {responseMessage && (
          <div className="mt-4 p-3 text-center bg-white text-black rounded shadow-md">
            {responseMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default AiAgent;
