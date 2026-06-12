import { useEffect } from 'react';

export default () => {
  useEffect(() => {
    window.location.href = '/auth/logout';
  }, []);

  return <div>Redirecting to Auth0 sign-out...</div>;
};
