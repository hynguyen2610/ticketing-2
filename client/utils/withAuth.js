import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();
    const { currentUser } = props; // Assume currentUser is passed as a prop

    useEffect(() => {
      if (!currentUser) {
        // Redirect to login if user is not authenticated
        router.push('/auth/signin');
      }
    }, [currentUser, router]);

    return currentUser ? <WrappedComponent {...props} /> : null; // Render nothing while redirecting
  };
};

export default withAuth;
