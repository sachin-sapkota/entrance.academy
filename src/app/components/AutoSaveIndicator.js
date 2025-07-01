'use client';

import { useEffect, useState } from 'react';

export default function AutoSaveIndicator({ 
  isSaving, 
  lastSaved,
  saveError 
}) {
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (isSaving) {
      setShowPulse(true);
    } else {
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isSaving]);

  return (
    <div className="fixed bottom-4 left-4 z-40 group">
      <div className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-200 backdrop-blur-sm
        ${saveError 
          ? 'bg-red-100/90 text-red-700 border border-red-200' 
          : 'bg-white/90 text-gray-600 border border-gray-200 shadow-sm'
        }
      `}>
        {/* Status indicator dot */}
        <div className="relative">
          <div className={`
            w-1.5 h-1.5 rounded-full transition-colors duration-200
            ${saveError ? 'bg-red-500' : isSaving ? 'bg-blue-500' : 'bg-green-500'}
          `} />
          {(isSaving || showPulse) && !saveError && (
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
          )}
        </div>
        
        {/* Status text */}
        <span>
          {saveError ? 'Auto-save off' : isSaving ? 'Saving...' : 'Auto-save on'}
        </span>
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        Press Ctrl+S to save manually
      </div>
    </div>
  );
} 