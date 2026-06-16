import Auth0ErrorAlert from '../../components/auth0-error-alert';

export default ({ query }) => {
  return (
    <section className="mx-auto max-w-md page-panel p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-brand">Create account</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Join Ticket System</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Create an Auth0-backed account and start selling or reserving tickets.
      </p>
      <Auth0ErrorAlert query={query} />
      <a href="/auth/login?screen_hint=signup" className="btn-primary mt-6 w-full">Sign up with Auth0</a>
    </section>
  );
};

export const getServerSideProps = async ({ query }) => {
  return {
    props: {
      query,
    },
  };
};
