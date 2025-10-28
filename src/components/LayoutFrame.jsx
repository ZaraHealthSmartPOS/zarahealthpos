import React from "react";

export default function LayoutFrame({ children }) {
  return (
    <div className="min-h-screen bg-zara-gray text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
