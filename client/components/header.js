import Link from 'next/link';

export default ({ currentUser }) => {
  const links = [
    { label: 'Sign Up', href: '/auth/signup', condition: !currentUser },
    { label: 'Sign In', href: '/auth/signin', condition: !currentUser },
    { label: 'Sell Ticket', href: '/tickets/new', condition: currentUser },
    { label: 'My Orders', href: '/orders', condition: currentUser },
    { label: 'Sign Out', href: '/auth/signout', condition: currentUser },
  ]
    .filter(linkConfig => linkConfig.condition) // Filter based on the condition
    .map(({ label, href }) => (
      <li key={href} className="nav-item">
        <Link className="nav-link" href={href}>
          {label}
        </Link>
      </li>
    ));

  return (
    <nav className="navbar navbar-light bg-light">
      <Link className="navbar-brand" href="/">
        What do you desire? {currentUser && currentUser.email}
      </Link>

      <div className="d-flex justify-content-end">
        <ul className="nav d-flex align-items-center">{links}</ul>
      </div>
    </nav>
  );
};
