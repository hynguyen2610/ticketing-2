import Link from 'next/link';
import { useRouter } from 'next/router';

export default ({currentUser}) => {

    const router = useRouter();

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
            <Link legacyBehavior className="nav-item" href={href}>
              <a className={`nav-link ${router.pathname === href ? 'active' : ''}`}>{label}</a>
            </Link>
          </li>
        ));

    return(
        <nav className="navbar navbar-expand-lg navbar-light">
        <Link className="navbar-brand" href="/">
        {currentUser ? currentUser.email : "Anonymous user"}
        </Link>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ml-auto">
                {links}
            </ul>
        </div>
    </nav>
    );
}