"use client";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

declare global {
  interface Window {
    IVSPlayer: any;
  }
}

export default function Watch() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const params = useParams();
  const sessionId = params.id as string;

  useEffect(() => {
    async function init() {
      const token = localStorage.getItem('token');
      const res = await fetch(`/student/sessions/${sessionId}/join`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        alert('join failed: ' + txt);
        return;
      }
      const { playbackUrl } = await res.json();

      const script = document.createElement('script');
      script.src = "https://player.live-video.net/1.6.0/amazon-ivs-player.min.js";
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        const IVSPlayer = window.IVSPlayer;
        if (!IVSPlayer || !IVSPlayer.isPlayerSupported) {
          alert('IVS Player not supported in this browser');
          return;
        }
        const player = IVSPlayer.create();
        player.attachHTMLVideoElement(videoRef.current!);
        player.load(playbackUrl);
        player.play().catch((e: any) => console.warn('playback error', e));
      };
    }
    init();
  }, [sessionId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Live Class</h2>
      <video ref={videoRef} controls style={{ width: '100%', maxWidth: 900 }} />
    </div>
  );
}
