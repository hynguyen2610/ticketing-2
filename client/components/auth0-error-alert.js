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
    <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-red-800" role="alert">
      <h2 className="text-sm font-semibold">Auth0 sign-in failed</h2>
      <p className="mt-1 text-sm">
        {description || 'Please try again. If the problem continues, check the Auth0 application settings.'}
      </p>
    </div>
  );
};
