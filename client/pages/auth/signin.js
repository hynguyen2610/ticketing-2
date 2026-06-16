import Auth0ErrorAlert from '../../components/auth0-error-alert';

export default ({ query }) => {
  return (
    <section className="mx-auto max-w-md page-panel p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-brand">Welcome back</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Sign in to Ticket System</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Continue with Auth0 to manage listings, orders, and account access.
      </p>
      <Auth0ErrorAlert query={query} />
      <a href="/auth/login" className="btn-primary mt-6 w-full">Continue with Auth0</a>
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
