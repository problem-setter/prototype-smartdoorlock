import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context';
import { RoomDetailView } from '@/components/rooms/RoomDetailView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DoorClosed } from 'lucide-react';

export const RoomDetailPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { rooms, setSelectedRoomId } = useApp();

  const currentRoom = rooms.find((r) => r.id === roomId);

  useEffect(() => {
    if (roomId) {
      setSelectedRoomId(roomId);
    }
    return () => {
      setSelectedRoomId(null);
    };
  }, [roomId, setSelectedRoomId]);

  const handleBack = () => {
    setSelectedRoomId(null);
    navigate('/rooms');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  if (!roomId || !currentRoom) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#f6f5f4] border border-[#e5e3df] flex items-center justify-center text-[#787671]">
          <DoorClosed className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#1a1a1a]">Ruangan Tidak Ditemukan</h2>
          <p className="text-sm text-[#787671] max-w-sm">
            Ruangan dengan ID &quot;{roomId}&quot; tidak terdaftar atau Anda tidak memiliki hak otorisasi akses.
          </p>
        </div>
        <Button
          onClick={handleBack}
          variant="outline"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="cursor-pointer bg-white text-[#1a1a1a] border-[#e5e3df] hover:bg-[#f6f5f4]"
        >
          Kembali ke Daftar Ruangan
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <RoomDetailView roomId={roomId} onBack={handleBack} />
    </div>
  );
};

export default RoomDetailPage;
