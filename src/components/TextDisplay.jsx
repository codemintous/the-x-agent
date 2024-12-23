import React from "react";
import Typewriter from "typewriter-effect";
import "../App.css";
import { useState } from "react";
import { speak } from "../utils";
import { VolumeUpIcon, ClipboardCopyIcon } from "@heroicons/react/outline";
import { CopyToClipboard } from 'react-copy-to-clipboard';

function TextDisplay({ content, animate = true }) {
  const [typingFinished, setTypingFinished] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // State for clipboard message

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000); // Hide message after 2 seconds
  };

  return (
    <>
      <div className="typer">
        {animate ? (
          <Typewriter
            onInit={(typewriter) => {
              typewriter
                .typeString(content)
                .callFunction(() => {
                  setTypingFinished(true);
                })
                .start();
            }}
            options={{
              delay: 0,
            }}
          />
        ) : (
          content
        )}
      </div>
      {(typingFinished || !animate) && (
        <div className="flex space-x-0 mt-2">
          <button
            className="p-2 rounded hover:bg-black hover:bg-opacity-30 transition duration-200"
            onClick={() => speak(content)}>
            <VolumeUpIcon className="h-3 w-3 text-white" />
          </button>
          <CopyToClipboard text={content} onCopy={handleCopy}>
            <button
              className="p-2 rounded hover:bg-black hover:bg-opacity-30 transition duration-200">
              <ClipboardCopyIcon className="h-3 w-3 text-white" />
            </button>
          </CopyToClipboard>
          {isCopied && (
            <span className="ml-2 p-2 text-white">Copied to Clipboard!</span>
          )}
        </div>
      )}
    </>
  );
}

export default TextDisplay;
