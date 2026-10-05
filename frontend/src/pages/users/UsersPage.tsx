import React from 'react';
import { UserManagementView } from '@/components/users/UserManagementView';

export const UsersPage: React.FC = () => {
  return (
    <div className="w-full">
      <UserManagementView />
    </div>
  );
};

export default UsersPage;
