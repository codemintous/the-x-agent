import React, { useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/outline";

const Flashcard = ({ text, progress, onNext, onPrev }) => {
  const flashcardRef = useRef(null);

  useEffect(() => {
    const flashcard = flashcardRef.current;
    const height = flashcard.clientHeight;
    const width = flashcard.clientWidth;

    const handleMove = (e) => {
      const xVal = e.layerX;
      const yVal = e.layerY;
      const yRotation = 20 * ((xVal - width / 2) / width);
      const xRotation = -20 * ((yVal - height / 2) / height);
      const string = `perspective(500px) scale(1.1) rotateX(${xRotation}deg) rotateY(${yRotation}deg)`;
      flashcard.style.transform = string;
    };

    const resetTransform = () => {
      flashcard.style.transform =
        "perspective(500px) scale(1) rotateX(0) rotateY(0)";
    };

    const handleClick = (e) => {
      const xVal = e.clientX - flashcard.getBoundingClientRect().left;
      if (xVal < width / 2) {
        onPrev();
      } else {
        onNext();
      }
    };
    

    flashcard.addEventListener("mousemove", handleMove);
    flashcard.addEventListener("mouseout", resetTransform);
    flashcard.addEventListener("click", handleClick);

    return () => {
      flashcard.removeEventListener("mousemove", handleMove);
      flashcard.removeEventListener("mouseout", resetTransform);
      flashcard.removeEventListener("click", handleClick);
    };
  }, [onNext, onPrev]);

  return (
    <>
      <div ref={flashcardRef} className="w-[300px] h-[260px] mb-2 mt-6 border border-[#202327]">
        <div className="rounded-tl-2xl rounded-tr-2xl w-full h-2 bg-blue-900" style={{ width: `${progress * 100}%` }}></div>
        <div className="bg-[#1a1a1a] flex w-full h-full bg-opacity-30 rounded-br-2xl rounded-bl-2xl justify-center items-center relative">
          <div className="flex w-[30px] h-[230px]  text-white p-1 items-center justify-center hover:text-transparent">
            <ChevronLeftIcon className="h-5 w-5"/>
          </div>
          <div className="overflow-y-auto flex w-[320px] h-[230px] font-extrabold text-center text-white text-base p-1 justify-center items-center">
            {text}
          </div>
          <div className="flex w-[30px] h-[230px] text-white p-1 items-center justify-center hover:text-transparent">
            <ChevronRightIcon className="h-5 w-5"/>
          </div>
        </div>
      </div>
    </>
  );
};

export default Flashcard;
