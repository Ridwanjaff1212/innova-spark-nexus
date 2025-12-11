import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Plus, Video, VideoOff, Mic, MicOff, 
  Code, Copy, LogOut, Monitor, Settings, Phone
} from 'lucide-react';

interface Room {
  id: string;
  name: string;
  description: string;
  language: string;
  code_content: string;
  created_by: string;
  is_active: boolean;
  max_participants: number;
}

interface Participant {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  is_host: boolean;
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML/CSS' },
];

const PairProgramming = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [code, setCode] = useState('// Start coding together!\n');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', language: 'javascript' });
  
  // Video chat state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('pair_programming_rooms')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRooms(data);
      }
    };

    fetchRooms();

    // Subscribe to room changes
    const roomChannel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pair_programming_rooms' }, fetchRooms)
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, []);

  // Real-time code sync
  useEffect(() => {
    if (!currentRoom) return;

    const codeChannel = supabase
      .channel(`room-${currentRoom.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pair_programming_rooms',
        filter: `id=eq.${currentRoom.id}`
      }, (payload) => {
        const newCode = (payload.new as Room).code_content;
        if (newCode !== code) {
          setCode(newCode);
        }
      })
      .subscribe();

    // Fetch participants
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', currentRoom.id);
      if (data) setParticipants(data);
    };

    fetchParticipants();

    const participantChannel = supabase
      .channel(`participants-${currentRoom.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_participants',
        filter: `room_id=eq.${currentRoom.id}`
      }, fetchParticipants)
      .subscribe();

    return () => {
      supabase.removeChannel(codeChannel);
      supabase.removeChannel(participantChannel);
    };
  }, [currentRoom?.id]);

  const createRoom = async () => {
    if (!user || !profile) return;

    const { data, error } = await supabase
      .from('pair_programming_rooms')
      .insert({
        name: newRoom.name,
        description: newRoom.description,
        language: newRoom.language,
        created_by: user.id,
        code_content: `// ${newRoom.name}\n// Language: ${newRoom.language}\n\n`
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create room', variant: 'destructive' });
      return;
    }

    // Join as host
    await supabase.from('room_participants').insert({
      room_id: data.id,
      user_id: user.id,
      username: profile.full_name,
      is_host: true
    });

    setCurrentRoom(data);
    setCode(data.code_content);
    setIsCreateOpen(false);
    setNewRoom({ name: '', description: '', language: 'javascript' });
    toast({ title: 'Room Created!', description: 'Others can now join your room' });
  };

  const joinRoom = async (room: Room) => {
    if (!user || !profile) return;

    // Check if already in room
    const { data: existing } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      await supabase.from('room_participants').insert({
        room_id: room.id,
        user_id: user.id,
        username: profile.full_name,
        is_host: false
      });
    }

    setCurrentRoom(room);
    setCode(room.code_content);
    toast({ title: 'Joined Room!', description: `Welcome to ${room.name}` });
  };

  const leaveRoom = async () => {
    if (!currentRoom || !user) return;

    await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', currentRoom.id)
      .eq('user_id', user.id);

    // Stop video
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    setCurrentRoom(null);
    setParticipants([]);
    setIsVideoOn(false);
    toast({ title: 'Left Room', description: 'You have left the programming room' });
  };

  const updateCode = useCallback(async (newCode: string) => {
    setCode(newCode);
    
    if (currentRoom) {
      await supabase
        .from('pair_programming_rooms')
        .update({ code_content: newCode })
        .eq('id', currentRoom.id);
    }
  }, [currentRoom]);

  const toggleVideo = async () => {
    if (!isVideoOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: isAudioOn });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
      } catch (error) {
        toast({ title: 'Camera Error', description: 'Could not access camera', variant: 'destructive' });
      }
    } else {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
        if (localStream.getAudioTracks().length > 0) {
          const audioStream = new MediaStream(localStream.getAudioTracks());
          setLocalStream(audioStream);
        } else {
          setLocalStream(null);
        }
      }
      setIsVideoOn(false);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <Code className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground">Please sign in to use Pair Programming</p>
        </Card>
      </div>
    );
  }

  // Room View
  if (currentRoom) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={leaveRoom}>
                <LogOut className="w-4 h-4 mr-2" />
                Leave Room
              </Button>
              <div>
                <h1 className="text-xl font-bold">{currentRoom.name}</h1>
                <Badge variant="secondary">{currentRoom.language}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={isVideoOn ? 'default' : 'outline'} 
                size="icon"
                onClick={toggleVideo}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              <Button 
                variant={isAudioOn ? 'default' : 'outline'} 
                size="icon"
                onClick={toggleAudio}
              >
                {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={copyCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Code Editor */}
            <Card className="lg:col-span-3">
              <CardContent className="p-0">
                <textarea
                  value={code}
                  onChange={(e) => updateCode(e.target.value)}
                  className="w-full h-[600px] p-4 font-mono text-sm bg-zinc-900 text-green-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  spellCheck={false}
                  placeholder="Start coding together..."
                />
              </CardContent>
            </Card>

            {/* Sidebar - Video & Participants */}
            <div className="space-y-4">
              {/* Video Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Local Video */}
                  <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                    {isVideoOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <VideoOff className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-xs">Camera Off</p>
                        </div>
                      </div>
                    )}
                    <Badge className="absolute bottom-2 left-2 text-xs">You</Badge>
                  </div>

                  {/* Remote Videos */}
                  {Array.from(remoteStreams.entries()).map(([odlId, stream]) => (
                    <div key={odlId} className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                      <video
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        ref={(el) => {
                          if (el) el.srcObject = stream;
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Participants */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participants ({participants.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {participants.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>{p.username}</span>
                        {p.is_host && <Badge variant="outline" className="text-xs">Host</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby View
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Pair Programming</h1>
          <p className="text-muted-foreground">Code together in real-time with video chat</p>
        </motion.div>

        <div className="flex justify-end mb-6">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Programming Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Room Name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                />
                <Select
                  value={newRoom.language}
                  onValueChange={(v) => setNewRoom({ ...newRoom, language: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={createRoom} className="w-full" disabled={!newRoom.name}>
                  Create Room
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => joinRoom(room)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{room.description || 'No description'}</p>
                      </div>
                      <Badge>{room.language}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Max {room.max_participants}</span>
                      </div>
                      <Button size="sm">Join Room</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {rooms.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Active Rooms</h3>
              <p className="text-muted-foreground mb-4">Create the first programming room!</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PairProgramming;
