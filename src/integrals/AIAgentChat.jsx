import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config/config';
import commandsList from '../data/commands.json';
import { ArrowLeftIcon } from '@heroicons/react/outline';

const AIAgentChat = ({ id, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState(id);
  const [agentDetails, setAgentDetails] = useState(null);
  const [threadId, setThreadId] = useState(null);

  const messagesEndRef = useRef(null); // Ref to scroll to the end of the chat

  useEffect(() => {
    const fetchAgentDetails = async () => {
      try {
        const response = await axios.get(`${config.BASE_URL}/api/assistants/${id}`);
        if (response.data.success) {
          const agentData = response.data.data;
          setAgentDetails(agentData);

          // Create a thread using the agent's _id
          const threadResponse = await axios.post(
            `${config.BASE_URL}/api/threads/${agentData._id}`
          );
          if (threadResponse.data.success) {
            setThreadId(threadResponse.data.data._id);
          } else {
            console.error('Failed to create thread:', threadResponse.data.message);
          }
        }
      } catch (error) {
        console.error('Failed to fetch agent details:', error);
      }
    };

    fetchAgentDetails();
  }, [id]);

  const handleSend = async () => {
    if (inputValue.trim() === '' || !threadId) return;

    // Add user message
    const userMessage = { text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and show loading indicator
    setInputValue('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${config.BASE_URL}/api/threads/${threadId}/messages`,
        { message: inputValue }
      );

      if (response.data.success && response.data.data?.content?.[0]?.text?.value) {
        const aiResponse = response.data.data.content[0].text.value;

        // Add AI response to messages
        const botMessage = { text: aiResponse, sender: 'bot' };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage = {
          text: 'Sorry, I couldn\'t understand the response. Please try again.',
          sender: 'bot',
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);

      // Add error message as bot response
      const errorMessage = {
        text: 'Oops! Something went wrong. Please try again later.',
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleCommandClick = (command) => {
    setInputValue(command.text);
    setShowCommands(false);
  };

  useEffect(() => {
    // Scroll to the bottom whenever messages update
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!agentDetails) {
    return <p className="text-white">Loading agent details...</p>;
  }

  return (
    <div className="w-full bg-bg-color text-white flex flex-col h-[700px]">
      <div className="absolute top-3 left-20 right-[-10] cursor-pointer" onClick={onClose}>
        <ArrowLeftIcon className="h-6 w-6 text-white" />
      </div>
      {/* Chat title */}
      {/* <div className="flex justify-center font-bold text-lg mb-3">Chat</div> */}
      <h2 className="text-2xl font-semibold text-center">{agentDetails.name}</h2>

      {/* Messages display */}
      <div className="flex-1 overflow-y-auto scrollbar-thin mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex mb-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.sender === 'bot' && (
              <div className="flex">
                <div className="rounded-full w-10 h-10 flex items-center justify-center bg-blue-500 text-white">
                  AI
                </div>
              </div>
            )}
            <div
              className={`max-w-xs p-3 rounded-lg shadow-md text-sm ${
                message.sender === 'user' ? 'bg-input-color text-white' : 'bg-tab-color text-white'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-2">
            <div className="max-w-xs p-3 rounded-lg shadow-md text-sm bg-tab-color text-gray-400">
              generating response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Commands Box */}
      {showCommands && (
        <div className="absolute bottom-32 left-4 right-4 bg-bg-color rounded-lg border border-gray-700 shadow-md max-h-60">
          <div className="flex justify-between items-center px-4 py-2 bg-bg-color border-b-2 border-gray-700 rounded-t-lg">
            <span className="font-bold text-white">Query Commands</span>
            <span
              className="cursor-pointer text-gray-400 hover:text-white"
              onClick={() => setShowCommands(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </span>
          </div>
          <div className="p-4 max-h-[200px] overflow-y-auto scrollbar-thin">
            {commandsList.map((command) => (
              <div
                key={command.id}
                className="p-2 hover:bg-[#1A1A1A] cursor-pointer rounded"
                onClick={() => handleCommandClick(command)}
              >
                {command.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input and send button */}
      <div className="relative flex items-center gap-2 mt-auto">
        {/* <span
          onClick={() => setShowCommands((prev) => !prev)}
          className="cursor-pointer absolute left-3 text-gray-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12h15m-15 6h15m-15-12h15"
            />
          </svg>
        </span> */}
        <input
          type="text"
          className="flex-1 py-3 px-2 bg-input-color text-white rounded border border-transparent focus:border-[#1D9BF0] focus:outline-none focus:bg-bg-color pr-10"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <span onClick={handleSend} className="cursor-pointer absolute right-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12L3.269 3.125A59.769 59.769 0 0121.485 12 59.768 59.768 0 013.27 20.875L5.999 12Zm0 0h7.5"
            />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default AIAgentChat;
