import React from 'react';
import { ArrowRight, Database } from 'lucide-react';

export const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="relative h-screen w-full">
      <img
        src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80"
        alt="Data Analysis"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50">
        <div className="container mx-auto px-6 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-12 h-12 text-blue-400" />
              <h1 className="text-5xl font-bold">SYNC DATA FLOWS</h1>
            </div>
            <p className="text-xl mb-8">
              Upload, label, and analyze your data with powerful visualization tools
            </p>
            <button
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 text-lg transition-colors"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};