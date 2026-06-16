import Link from 'next/link';
import Auth0ErrorAlert from '../../components/auth0-error-alert';

export default ({ query }) => {
  return (
    <section className="mx-auto max-w-md page-panel p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-red-600">Authentication</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Sign-in error</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Auth0 could not complete the request. Review the details and try again.
      </p>
      <Auth0ErrorAlert query={query} />
      <Link href="/auth/signin" className="btn-primary mt-6 w-full">
        Try again
      </Link>
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
