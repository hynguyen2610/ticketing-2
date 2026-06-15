import Auth0ErrorAlert from '../../components/auth0-error-alert';

export default ({ query }) => {
  return (
    <div>
      <h1>Sign Up</h1>
      <Auth0ErrorAlert query={query} />
      <p>Create an account using Auth0.</p>
      <a href="/auth/login?screen_hint=signup" className="btn btn-primary">Sign up with Auth0</a>
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
