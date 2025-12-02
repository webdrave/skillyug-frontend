"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface SessionInfo {
  ingestEndpoint: string;
  streamKey: string;
  playbackUrl: string;
  channelId: string;
}

export default function MentorStart() {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const params = useParams();
  const sessionId = params.id as string;

  async function startSession() {
    const token = localStorage.getItem('token'); // JWT
    const res = await fetch(`/mentor/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) return alert('start failed: ' + JSON.stringify(data));
    setInfo(data);
  }

  function publishInstructionsRTMPS() {
    if (!info) return;
    const { ingestEndpoint, streamKey } = info;
    const rtmpsUrl = `rtmps://${ingestEndpoint}:443/app/${streamKey}`;
    alert(`Use this RTMPS URL in OBS:\n\n${rtmpsUrl}`);
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Mentor Start Page</h2>
      <button onClick={startSession} className="px-4 py-2 bg-blue-600 text-white rounded">Start Session</button>

      {info && (
        <div className="mt-4">
          <p><strong>Ingest:</strong> {info.ingestEndpoint}</p>
          <p><strong>Playback:</strong> {info.playbackUrl}</p>
          <p><strong>Stream key:</strong> <code>{info.streamKey}</code></p>

          <button onClick={publishInstructionsRTMPS} className="mt-2 px-3 py-1 bg-gray-800 text-white rounded">Copy OBS RTMPS URL</button>

          <div className="mt-4">
            <p>Or use IVS WebRTC broadcast SDK (recommended for browser publish). See IVS docs for exact SDK usage and token exchange.</p>
          </div>
        </div>
      )}
    </div>
  );
}
