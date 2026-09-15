// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0f0f] text-center px-4">
      <h1 className="text-8xl font-bold text-red-600 mb-4">404</h1>
      <h2 className="text-3xl font-semibold mb-6">Page not found</h2>
      <p className="text-gray-400 mb-10 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/"
        className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-gray-200 transition-colors"
      >
        Go back to Home
      </Link>
    </div>
  );
}