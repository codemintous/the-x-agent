import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/outline'; 


const Navbar = () => {
  return (
    <div className="w-full h-[38px] bg-black bg-opacity-90 p-2">
      <Link to="/" className="text-white">
        <HomeIcon className="h-5 w-5" />
      </Link>
    </div>
  );
};

export default Navbar;