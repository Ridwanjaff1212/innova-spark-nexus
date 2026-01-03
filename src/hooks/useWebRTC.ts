import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PeerConnection {
  pc: RTCPeerConnection;
  userId: string;
  username: string;
}

interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  username: string;
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (userId: string) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useWebRTC({
  roomId,
  userId,
  username,
  onRemoteStream,
  onRemoteStreamRemoved,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
  const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Cleanup signals when component unmounts
  useEffect(() => {
    return () => {
      cleanupSignals();
    };
  }, [roomId, userId]);

  const cleanupSignals = async () => {
    await supabase
      .from('webrtc_signals')
      .delete()
      .eq('room_id', roomId)
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
  };

  const createPeerConnection = useCallback((remoteUserId: string, remoteUsername: string): RTCPeerConnection => {
    console.log(`Creating peer connection for user: ${remoteUserId}`);
    
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to', remoteUserId);
        await (supabase.from('webrtc_signals') as any).insert({
          room_id: roomId,
          from_user_id: userId,
          to_user_id: remoteUserId,
          signal_type: 'ice-candidate',
          signal_data: { candidate: event.candidate.toJSON() },
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track from', remoteUserId);
      if (event.streams[0]) {
        onRemoteStream?.(remoteUserId, event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${remoteUserId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        onRemoteStreamRemoved?.(remoteUserId);
        peerConnections.current.delete(remoteUserId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${remoteUserId}:`, pc.iceConnectionState);
    };

    // Add local tracks if available
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    peerConnections.current.set(remoteUserId, { pc, userId: remoteUserId, username: remoteUsername });
    return pc;
  }, [roomId, userId, localStream, onRemoteStream, onRemoteStreamRemoved]);

  const startLocalStream = useCallback(async (video: boolean = true, audio: boolean = true) => {
    try {
      setIsConnecting(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } : false,
      });

      setLocalStream(stream);
      setIsVideoEnabled(video);
      setIsAudioEnabled(audio);
      setIsConnecting(false);

      // Add tracks to existing peer connections
      peerConnections.current.forEach(({ pc }) => {
        stream.getTracks().forEach(track => {
          const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            pc.addTrack(track, stream);
          }
        });
      });

      return stream;
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Could not access camera/microphone');
      setIsConnecting(false);
      throw err;
    }
  }, []);

  const stopLocalStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      setIsVideoEnabled(false);
      setIsAudioEnabled(false);
    }
  }, [localStream]);

  const toggleVideo = useCallback(async () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      } else if (!isVideoEnabled) {
        // Start video if it wasn't enabled initially
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];
          localStream.addTrack(newVideoTrack);
          setIsVideoEnabled(true);
          
          // Update peer connections
          peerConnections.current.forEach(({ pc }) => {
            pc.addTrack(newVideoTrack, localStream);
          });
        } catch (err) {
          console.error('Could not start video:', err);
        }
      }
    }
  }, [localStream, isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const initiateCall = useCallback(async (remoteUserId: string, remoteUsername: string) => {
    console.log('Initiating call to', remoteUserId);
    
    const pc = createPeerConnection(remoteUserId, remoteUsername);
    
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await (supabase.from('webrtc_signals') as any).insert({
        room_id: roomId,
        from_user_id: userId,
        to_user_id: remoteUserId,
        signal_type: 'offer',
        signal_data: { sdp: offer },
      });

      console.log('Offer sent to', remoteUserId);
    } catch (err) {
      console.error('Error creating offer:', err);
      throw err;
    }
  }, [roomId, userId, createPeerConnection]);

  const handleOffer = useCallback(async (fromUserId: string, fromUsername: string, offer: RTCSessionDescriptionInit) => {
    console.log('Received offer from', fromUserId);
    
    let peerData = peerConnections.current.get(fromUserId);
    if (!peerData) {
      const pc = createPeerConnection(fromUserId, fromUsername);
      peerData = { pc, userId: fromUserId, username: fromUsername };
    }

    try {
      await peerData.pc.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Apply pending ICE candidates
      const pending = pendingCandidates.current.get(fromUserId) || [];
      for (const candidate of pending) {
        await peerData.pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current.delete(fromUserId);

      const answer = await peerData.pc.createAnswer();
      await peerData.pc.setLocalDescription(answer);

      await (supabase.from('webrtc_signals') as any).insert({
        room_id: roomId,
        from_user_id: userId,
        to_user_id: fromUserId,
        signal_type: 'answer',
        signal_data: { sdp: answer },
      });

      console.log('Answer sent to', fromUserId);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [roomId, userId, createPeerConnection]);

  const handleAnswer = useCallback(async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
    console.log('Received answer from', fromUserId);
    
    const peerData = peerConnections.current.get(fromUserId);
    if (peerData) {
      try {
        await peerData.pc.setRemoteDescription(new RTCSessionDescription(answer));
        
        // Apply pending ICE candidates
        const pending = pendingCandidates.current.get(fromUserId) || [];
        for (const candidate of pending) {
          await peerData.pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current.delete(fromUserId);
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  }, []);

  const handleIceCandidate = useCallback(async (fromUserId: string, candidate: RTCIceCandidateInit) => {
    console.log('Received ICE candidate from', fromUserId);
    
    const peerData = peerConnections.current.get(fromUserId);
    if (peerData && peerData.pc.remoteDescription) {
      try {
        await peerData.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    } else {
      // Queue candidate if remote description not set yet
      const pending = pendingCandidates.current.get(fromUserId) || [];
      pending.push(candidate);
      pendingCandidates.current.set(fromUserId, pending);
    }
  }, []);

  // Subscribe to WebRTC signals
  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase
      .channel(`webrtc-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webrtc_signals',
          filter: `to_user_id=eq.${userId}`,
        },
        async (payload) => {
          const signal = payload.new as any;
          
          if (signal.from_user_id === userId) return; // Ignore own signals

          console.log('Received signal:', signal.signal_type, 'from', signal.from_user_id);

          switch (signal.signal_type) {
            case 'offer':
              await handleOffer(signal.from_user_id, 'User', signal.signal_data.sdp);
              break;
            case 'answer':
              await handleAnswer(signal.from_user_id, signal.signal_data.sdp);
              break;
            case 'ice-candidate':
              await handleIceCandidate(signal.from_user_id, signal.signal_data.candidate);
              break;
          }

          // Cleanup processed signal
          await supabase.from('webrtc_signals').delete().eq('id', signal.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, handleOffer, handleAnswer, handleIceCandidate]);

  const disconnect = useCallback(() => {
    peerConnections.current.forEach(({ pc, userId: peerId }) => {
      pc.close();
      onRemoteStreamRemoved?.(peerId);
    });
    peerConnections.current.clear();
    stopLocalStream();
    cleanupSignals();
  }, [stopLocalStream, onRemoteStreamRemoved]);

  return {
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    isConnecting,
    error,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
    initiateCall,
    disconnect,
    peerConnections: peerConnections.current,
  };
}
