import Link from 'next/link';
import { useRouter } from 'next/router';
import UserAvatar from './user-avatar';

export default ({ currentUser }) => {
  const router = useRouter();
  const links = [
    { label: 'Sign Up', href: '/auth/signup', condition: !currentUser },
    { label: 'Sign In', href: '/auth/signin', condition: !currentUser },
    { label: 'Sell Ticket', href: '/tickets/new', condition: currentUser },
    { label: 'My Orders', href: '/orders', condition: currentUser },
    { label: 'Sign Out', href: '/auth/logout', condition: currentUser },
  ]
    .filter(linkConfig => linkConfig.condition)
    .map(({ label, href }) => (
      <li key={href}>
        <Link legacyBehavior href={href}>
          <a
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              router.pathname === href
                ? 'bg-blue-50 text-brand'
                : 'text-muted hover:bg-slate-100 hover:text-ink'
            }`}
          >
            {label}
          </a>
        </Link>
      </li>
    ));

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-lg font-semibold tracking-normal text-ink">
            Ticket System
          </Link>
          <div className="lg:hidden">
            <UserAvatar user={currentUser} size="sm" />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:gap-6">
          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap items-center gap-1">{links}</ul>
          </nav>

          <div className="hidden items-center gap-3 rounded-md border border-line bg-surface px-3 py-2 lg:flex">
            <UserAvatar user={currentUser} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {currentUser?.name || currentUser?.email || 'Anonymous user'}
              </p>
              {currentUser?.email && currentUser?.name && (
                <p className="truncate text-xs text-muted">{currentUser.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
