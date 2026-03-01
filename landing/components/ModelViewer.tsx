'use client';

import '@google/model-viewer';
import { useEffect, useRef } from 'react';

export default function ModelViewer() {
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    if (viewerRef.current) {
      // Additional configurations can be set via ref if needed
      viewerRef.current.setAttribute('camera-orbit', '45deg 75deg 105%');
      viewerRef.current.setAttribute('rotation-per-second', '30deg');
    }
  }, []);

  return (
    <div className="w-full h-full relative bg-transparent">
      {/* @ts-ignore */}
      <model-viewer
        ref={viewerRef}
        src="/bach.glb"
        alt="Interactive 3D furniture model"
        auto-rotate
        camera-controls
        ar
        shadow-intensity="1"
        exposure="1.2"
        environment-image="neutral"
        ar-modes="webxr scene-viewer quick-look"
        min-camera-orbit="auto auto 80%"
        max-camera-orbit="auto auto 130%"
        interaction-prompt="none"
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
}
