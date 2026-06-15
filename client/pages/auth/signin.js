import Auth0ErrorAlert from '../../components/auth0-error-alert';

export default ({ query }) => {
  return (
    <div>
      <h1>Sign In</h1>
      <Auth0ErrorAlert query={query} />
      <p>Log in with Auth0 to access the ticketing system.</p>
      <a href="/auth/login" className="btn btn-primary">Continue with Auth0</a>
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
