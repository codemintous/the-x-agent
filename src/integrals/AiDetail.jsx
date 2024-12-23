import React, { useState,useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/outline';
import axios from "axios";
import config from '../config/config';

const AiDetail = ({ id, onClose }) => {

  const [agentDetails, setAgentDetails] = useState(null);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const response = await axios.get(
          `${config.BASE_URL}/api/assistants/${id}`
        );
        if (response.data.success) {
          setAgentDetails(response.data.data);
        }
      } catch (error) {
        console.log("Failed to fetch agent details:", error);
      }
    };

    fetchAgentDetails();
  }, [id]);

  if (!agentDetails) {
    return <p className="text-white">Loading...</p>;
  }



  return (
    <div className="w-full h-full bg-bg-color text-white p-5 flex flex-col items-center">
      <div className="absolute top-3 left-20 right-[-10] cursor-pointer" onClick={onClose}>
        <ArrowLeftIcon className="h-6 w-6 text-white" />
      </div>
      
      <div className="bg-bg-color rounded-lg shadow-lg p-5 w-full max-w-md border border-gray-700 overflow-y-auto scrollbar-thin">
        {/* Blank Space for Graph */}
        <div className="w-full h-56 bg-gray-800 mb-4 rounded-lg flex items-center justify-center">
          {/* Placeholder for Graph */}
          <p className=" text-gray-400 ">Graph Placeholder</p>
        </div>
        
        {/* Token Name and Details */}
        <h2 className="text-2xl font-semibold text-left">{agentDetails.name}</h2>
        <p className="text-lg text-left text-gray-300">Token : {agentDetails.tokenName}</p>
        <p className="text-sm text-gray-400">Supply: {agentDetails.tokenSupply}</p>
        
        {/* Description */}
        <p className="text-sm text-left text-gray-400 mb-4">{agentDetails.instructions}</p>
        
        {/* Action Buttons */}
        {/* <div className="flex justify-start mt-4 space-x-4">
          <button className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
            Buy
          </button>
          <button className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
            Sell
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default AiDetail;
