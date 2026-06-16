const initialsFromUser = (user) => {
  const source = user?.name || user?.email || 'User';
  const parts = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join('') || 'U';
};

export default ({ user, size = 'md' }) => {
  const dimensions = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  if (user?.picture) {
    return (
      <img
        src={user.picture}
        alt={user.name || user.email || 'User profile'}
        className={`${dimensions} rounded-full border border-line object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`${dimensions} inline-flex items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700`}>
      {initialsFromUser(user)}
    </div>
  );
};
