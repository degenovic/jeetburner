'use client';

import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-600 rounded-full animate-ping opacity-75"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-lg font-medium text-gray-300">
          Loading
          <span className="inline-flex ml-1 space-x-1">
            <span className="inline-block animate-bounce delay-0">.</span>
            <span className="inline-block animate-bounce delay-100">.</span>
            <span className="inline-block animate-bounce delay-200">.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
