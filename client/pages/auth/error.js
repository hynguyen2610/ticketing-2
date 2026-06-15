import Link from 'next/link';
import Auth0ErrorAlert from '../../components/auth0-error-alert';

export default ({ query }) => {
  return (
    <div>
      <h1>Sign-in error</h1>
      <Auth0ErrorAlert query={query} />
      <Link href="/auth/signin" className="btn btn-primary">
        Try again
      </Link>
    </div>
  );
};

export const getServerSideProps = async ({ query }) => {
  return {
    props: {
      query,
    },
  };
};
