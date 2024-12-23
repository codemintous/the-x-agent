import React, { useRef, useEffect } from 'react';
import "../App.css";

function Button({ text }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;

    const handleMouseOver = () => {
      button.style.transform = 'scale(1.1)';
    };

    const handleMouseOut = () => {
      button.style.transform = 'scale(1)';
    };

    const handleMouseDown = () => {
      button.style.transform = 'scale(0.95)';
    };

    const handleMouseUp = () => {
      button.style.transform = 'scale(1.1)';
    };

    button.addEventListener('mouseover', handleMouseOver);
    button.addEventListener('mouseout', handleMouseOut);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mouseover', handleMouseOver);
      button.removeEventListener('mouseout', handleMouseOut);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      className="bg-btn-color text-white p-3 m-1 w-[200px] h-[50px] text-sm rounded-md transition-transform"
    >
      {text}
    </button>
  );
}

export default Button;