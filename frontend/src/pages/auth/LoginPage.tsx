import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/context';
import { LoginPage as LoginAuthComponent } from '@/components/auth/LoginPage';

export const LoginPage: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (currentUser) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/rooms';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  return <LoginAuthComponent />;
};

export default LoginPage;
