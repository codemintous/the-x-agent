import React, { useEffect, useState } from "react";
import axios from "axios";
import Web3 from "web3";
import { toast } from "sonner";
import AiDetail from "./AiDetail";
import AIAgentChat from "./AIAgentChat";
import config from "../config/config";

const AiList = () => {
  const [agents, setAgents] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState(null);
  const [accountAddress, setAccountAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [selectedAgentDesc, setSelectedAgentDesc] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');


  useEffect(() => {
    handleConnectWallet();
    const messageListener = (message) => {
      console.log('address received from background.js:', message);

      // if (message.action === 'SEND_WARPCAST_TEXT') {
      //   setTwitterText(message.data);
      //   console.log('Twitter text received:', message.data);
      //   // handleApiCall(message.data);
      // }
      if (message.action === 'WALLET_CONNECTED') {
        setWalletAddress(message.data);
        console.log('address received:', message.data);
        // handleApiCall(message.data);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  


  useEffect(() => {
 
    const fetchAgents = async () => {
      try {
        const response = await axios.get(
          `${config.BASE_URL}/api/assistants`
        );
        if (response.data.success) {
          setAgents(response.data.data);
          console.log("Agent list fetched:", response.data.data);
        }
      } catch (error) {
        setErrorMessage("Failed to fetch agents");
      }
    };

    fetchAgents();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "PROVIDER_DATA") {
        console.log("Provider data received:", message);
        setProvider(message.provider);
        setAccountAddress(message.accountAddress);
        setChainId(message.chainId);
      }
    });
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

  const buyTransactionFunc = async (tokenAddress, amount) => {
    try {
      const data = {
        userAddress: accountAddress || "0x6AEEb12fe14b7DAE54277e6bb0042466E2161bF8",
        chainId: chainId || `84532`,
        tokenAddress: tokenAddress,
        amount: amount,
      };

      const response = await axios.post(
        "https://magicmeme-backend.potp.xyz/memehub/getBuyCalldata",
        data,
        { headers: { "Content-Type": "application/json" } }
      );

      const callData = response.data.data;
      const web3 = new Web3(provider);

      const transactionData = {
        data: callData.calldata[0],
        to: callData.to,
        from: callData.from,
        value: callData.value,
        gasLimit: 850000,
      };

      const signedTx = await web3.eth.sendTransaction(transactionData);
      toast.message(signedTx.transactionHash);
      return signedTx;
    } catch (e) {
      console.log("Error in transaction:", e);
    }
  };

  const handleOpenModal = (agent, action) => {
    setSelectedAgent(agent);
    setActionType(action);
    setAmount("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
    setActionType("");
    setAmount("");
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleConfirmAction = async () => {
    if (amount === "" || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (actionType === "Buy") {
      await buyTransactionFunc(
        selectedAgent?.tokenName,
        Web3.utils.toWei(amount, "ether").toString()
      );
    }

    handleCloseModal();
  };

  const handleAgentClick = (agent) => {
    setSelectedAgentDesc(agent._id); // Only pass the _id to AiDetail
  };

  return (
    <div className="w-full h-full bg-black p-4 flex flex-col  items-center space-y-4">
      <h2>walletAddress:{walletAddress}</h2>
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {selectedAgentDesc ? (
        <AIAgentChat id={selectedAgentDesc} onClose={() => setSelectedAgentDesc(null)} />
      ) : (
        <div className="w-full h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {agents.map((agent, index) => (
            <div
              key={index}
              className="bg-[#111111] flex items-center p-4 rounded-lg border border-gray-700 w-full mb-4"
            >
              <div
                className="w-14 h-14 flex items-center justify-center rounded-full bg-btn-color text-white font-bold mr-4"
              >
                {agent.tokenName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h3
                  className="text-base font-bold text-white cursor-pointer"
                  onClick={() => handleAgentClick(agent)}
                >
                  {agent.name}
                </h3>
                <p className="text-sm text-gray-400">Supply: {agent.tokenSupply}</p>
                <p className="text-xs text-gray-500">
                  {agent.instructions.substring(0, 25)}...
                </p>
                <div className="flex mt-2 space-x-2">
                  <button
                    onClick={() => handleOpenModal(agent, "Buy")}
                    className="bg-green-500 text-black px-3 py-1 rounded hover:bg-green-600"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => handleOpenModal(agent, "Sell")}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Sell
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={handleCloseModal}
          ></div>
          <div className="bg-[#111111] rounded-lg p-8 z-10 max-w-md w-full border-2 border-gray-300 relative shadow-lg">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-white mb-4">
              {actionType} {selectedAgent?.name}
            </h2>
            <p className="text-gray-400 mb-6">
              How much would you like to {actionType.toLowerCase()}?
            </p>
            <input
              type="number"
              value={amount}
              placeholder="Amount"
              onChange={handleAmountChange}
              className="bg-input-color border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color text-white rounded px-3 py-2 w-full mb-4"
            />
            <button
              onClick={handleConfirmAction}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Confirm {actionType}
            </button>
          </div>
        </div>
      )}
    </div>

  );
};

export default AiList;
