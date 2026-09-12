'use client';

import React from 'react';
import PhotoboothSession from '@/components/PhotoboothSession';

export default function BoothRoomPage({ params }) {
  // CORE RULE: The URL room ID is the source of truth.
  // Never generate a new room ID when the /booth/[roomId] page loads.
  const roomId = (params?.roomId || '').trim().toUpperCase();

  return <PhotoboothSession roomId={roomId} startInBooth={true} />;
}
