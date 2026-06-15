import 'bootstrap/dist/css/bootstrap.css';
import buildClient from '../api/build-client';
import NewHeader from '../components/new-header';
import NewFooter from '../components/new-footer';
import '../resources/style.css';

const AppComponent = ({ Component, pageProps, currentUser }) => {
  return (
    <>
      <NewHeader currentUser={currentUser} />
      <div className="main-content container">
        <Component currentUser={currentUser} {...pageProps} />
      </div>
      <NewFooter />
    </>
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
