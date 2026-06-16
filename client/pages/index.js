import Link from 'next/link';

const LandingPage = ({ currentUser, tickets }) => {
  const ticketList = tickets.map((ticket) => {
    return (
      <tr key={ticket.id} className="border-b border-line last:border-0">
        <td className="px-4 py-4 font-medium text-ink">{ticket.title}</td>
        <td className="px-4 py-4 text-muted">${ticket.price}</td>
        <td className="px-4 py-4 text-right">
          <Link href="tickets/[ticketId]" as={`/tickets/${ticket.id}`} className="font-medium text-brand hover:text-blue-700">
            View
          </Link>
        </td>
      </tr>
    );
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Marketplace</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Tickets showcase</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Browse available tickets and manage your listings from a focused workspace.
          </p>
        </div>
        <Link href="/tickets/new" className="btn-primary">
          Add ticket
        </Link>
      </div>

      <div className="page-panel overflow-hidden">
        {tickets.length > 0 ? (
          <table className="w-full table-fixed text-left text-sm">
            <thead className="border-b border-line bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>{ticketList}</tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <h2 className="text-base font-semibold text-ink">No tickets available</h2>
            <p className="mt-2 text-sm text-muted">
              New tickets will appear here as soon as sellers publish them.
            </p>
            {currentUser && (
              <Link href="/tickets/new" className="btn-secondary mt-5">
                Create the first ticket
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

LandingPage.getInitialProps = async (context, client, currentUser) => {
  try {
    const { data } = await client.get('/api/tickets');
    return { tickets: data };
  } catch (err) {
    return { tickets: [] };
  }
};

export default LandingPage;
