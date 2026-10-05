import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context';
import { RoomList } from '@/components/rooms/RoomList';

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedRoomId } = useApp();

  useEffect(() => {
    // Clear selected room in context when on the room list index page
    setSelectedRoomId(null);
  }, [setSelectedRoomId]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    navigate(`/rooms/${roomId}`);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="w-full">
      <RoomList onSelectRoom={handleSelectRoom} />
    </div>
  );
};

export default RoomsPage;
