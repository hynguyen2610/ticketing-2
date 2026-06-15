const getQueryValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export default ({ query = {} }) => {
  const error = getQueryValue(query.error);
  const description = getQueryValue(query.error_description);

  if (!error) {
    return null;
  }

  return (
    <div className="alert alert-danger" role="alert">
      <h4>Auth0 sign-in failed</h4>
      <p className="mb-0">
        {description || 'Please try again. If the problem continues, check the Auth0 application settings.'}
      </p>
    </div>
  );
};
