import buildClient from '../api/build-client';
import NewHeader from '../components/new-header';
import NewFooter from '../components/new-footer';
import '../resources/style.css';

const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <div className="min-h-screen bg-surface">
      <NewHeader currentUser={currentUser} />
      <main className="mx-auto min-h-[calc(100vh-145px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Component currentUser={currentUser} {...pageProps} />
      </main>
      <NewFooter />
    </div>
  );
};

AppComponent.getInitialProps = async appContext => {
  const client = buildClient(appContext.ctx);
  let currentUser = null;

  try {
    const { data } = await client.get('/api/users/currentuser');
    currentUser = data.currentUser;
  } catch (err) {
    currentUser = null;
  }

  let pageProps = {};
  if (appContext.Component.getInitialProps) {
    pageProps = await appContext.Component.getInitialProps(appContext.ctx, client, currentUser);
  }

  return {
    pageProps,
    currentUser
  };
};

export default AppComponent;
