'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'question');

      console.log('Test upload starting:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hasSession: !!session
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'X-Supabase-Auth': session.access_token
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setResult(data);
    } catch (err) {
      console.error('Upload test error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Upload Test Page</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select an image to test upload
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {uploading && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-600">Uploading...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-600 font-semibold mb-2">Upload Successful!</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
              {result.file?.url && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Uploaded Image:</p>
                  <img 
                    src={result.file.url} 
                    alt="Uploaded" 
                    className="max-w-full h-auto rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h2>
          <p className="text-xs text-gray-600">Check browser console for detailed logs</p>
          <p className="text-xs text-gray-600 mt-1">Upload endpoint: /api/upload</p>
          <p className="text-xs text-gray-600">Required fields: file (File), entityType (string)</p>
        </div>
      </div>
    </div>
  );
} 