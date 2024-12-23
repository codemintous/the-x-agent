import React, { useEffect, useState } from "react";
import axios from "axios";
import Web3 from "web3"; // Web3 is already imported
import { toast } from "sonner"; // Toast notification

const MemeList = () => {
  const [memes, setMemes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState(null);
  const [accountAddress, setAccountAddress] = useState(null);
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    const fetchMemes = async () => {
      try {
        const response = await axios.post(
          'https://magicmeme-backend.potp.xyz/memehub/getDetails',
        
          { chainId: `84532` },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setMemes(response.data);
        console.log("meme list========>>>", response.data);
      } catch (error) {
        setErrorMessage('Failed to fetch memes');
      }
    };

    fetchMemes();

    // Listen for messages from content.js
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "PROVIDER_DATA") {
        console.log("Provider data received:", message);
        setProvider(message.provider);
        setAccountAddress(message.accountAddress);
        setChainId(message.chainId);
      }
    });
  }, []);

  const buyTransactionFunc = async (tokenAddress, amount) => {
    try {
      const data = {
        userAddress: "0x6AEEb12fe14b7DAE54277e6bb0042466E2161bF8",
        chainId: `84532`,
        tokenAddress: tokenAddress,
        amount: amount,
      };

      const response = await axios.post(

        'https://magicmeme-backend.potp.xyz/memehub/getBuyCalldata',
        data,
        {
          headers: { 'Content-Type': 'application/json' },
        }
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
      console.log('error =======>>>>>>>>', e);
    }
  };

  const handleOpenModal = (meme, action) => {
    setSelectedMeme(meme);
    setActionType(action);
    setAmount("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMeme(null);
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
      // await buyTransactionFunc( selectedMeme.tokenAddress, amount );
      await buyTransactionFunc(selectedMeme?.tokenAddressBase,
        Web3.utils.toWei(amount, 'ether').toString())
    }

    handleCloseModal();
  };

  return (
    <div className="w-full h-full bg-black p-4 flex flex-col items-center space-y-4 overflow-y-auto scrollbar-thin">
      {errorMessage && <p className="text-red-500">{errorMessage}</p>}
      {memes.map((meme, index) => (
        <div
          key={index}
          className="bg-[#111111] flex items-center p-4 rounded-lg border border-gray-700 w-full"
        >
          <img
            src={meme.logo}
            alt={meme.fullname}
            className="w-12 h-12 object-cover rounded-full mr-4"
          />
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-white">{meme.fullname}</h3>
            <p className="text-sm text-gray-400">{meme.symbol}</p>
            <p className="text-xs text-gray-500">
              {meme.description.substring(0, 25)}...
            </p>
            <div className="flex mt-2 space-x-2">
              <button
                onClick={() => handleOpenModal(meme, "Buy")}
                className="bg-[#32cd32] text-black px-3 py-1 rounded hover:bg-green-600"
              >
                Buy
              </button>
              <button
                onClick={() => handleOpenModal(meme, "Sell")}
                className="bg-[#ff4500] text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      ))}

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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>

            </button>
            <h2 className="text-xl font-bold text-white mb-4">
              {actionType} {selectedMeme?.fullname}
            </h2>
            <p className="text-gray-400 mb-6">
              How much would you like to {actionType.toLowerCase()}?
            </p>
            <input
              type="number"
              value={amount}
              placeholder="amount"
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

export default MemeList;
