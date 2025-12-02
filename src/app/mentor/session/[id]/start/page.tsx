"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SessionInfo {
  ingestServer: string;
  streamKey: string;
  playbackUrl: string;
  channelId: string;
  sessionId: string;
  status: string;
  message: string;
}

export default function MentorStart() {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const sessionId = params.id as string;

  // Get credentials first (reserves a channel from the pool)
  async function getCredentials() {
    setLoading(true);
    const token = localStorage.getItem('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
      const res = await fetch(`${API_URL}/mentor/sessions/${sessionId}/credentials`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Credentials error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          return alert('Failed to get credentials: ' + (errorData.error || errorData.message || errorText));
        } catch {
          return alert('Failed to get credentials: ' + errorText);
        }
      }
      
      const data = await res.json();
      setInfo(data);
    } catch (error: any) {
      console.error('Credentials error:', error);
      alert('Failed to get credentials: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Start the session (go live)
  async function startSession() {
    setLoading(true);
    const token = localStorage.getItem('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    try {
      const res = await fetch(`${API_URL}/mentor/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Start error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          return alert('Start failed: ' + (errorData.error || errorData.message || errorText));
        } catch {
          return alert('Start failed: ' + errorText);
        }
      }
      
      const data = await res.json();
      setInfo({
        ingestServer: data.ingestEndpoint,
        streamKey: data.streamKey,
        playbackUrl: data.playbackUrl,
        channelId: data.channelId,
        sessionId: sessionId,
        status: 'LIVE',
        message: 'Session is now LIVE!'
      });
    } catch (error: any) {
      console.error('Start error:', error);
      alert('Start failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  }

  function getRtmpsUrl() {
    if (!info) return '';
    return `rtmps://${info.ingestServer}:443/app/${info.streamKey}`;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mentor Streaming Setup</h2>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button 
            onClick={getCredentials} 
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '🔑 Get OBS Credentials'}
          </button>
          <button 
            onClick={startSession} 
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : '▶ Start & Go Live'}
          </button>
        </div>

        {info && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-sm font-medium ${info.status === 'LIVE' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'}`}>
                {info.status === 'LIVE' ? '🔴 LIVE' : '🟡 Ready'}
              </span>
              <span className="text-sm text-gray-600">{info.message}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full RTMPS URL (paste in OBS Server field):</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm break-all">{getRtmpsUrl()}</code>
                  <button 
                    onClick={() => copyToClipboard(getRtmpsUrl(), 'RTMPS URL')}
                    className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ingest Server:</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm">{info.ingestServer}</code>
                  <button 
                    onClick={() => copyToClipboard(info.ingestServer, 'Ingest Server')}
                    className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream Key:</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">{info.streamKey}</code>
                  <button 
                    onClick={() => copyToClipboard(info.streamKey, 'Stream Key')}
                    className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Playback URL (for students):</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm break-all">{info.playbackUrl}</code>
                  <button 
                    onClick={() => copyToClipboard(info.playbackUrl, 'Playback URL')}
                    className="px-3 py-1 bg-gray-800 text-white rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>OBS Setup:</strong> Go to Settings → Stream → Service: Custom → 
                Paste the Server URL and Stream Key → Click Apply → Start Streaming!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
