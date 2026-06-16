import Router from 'next/router';
import useRequest from '../../hooks/use-request';

const TicketShow = ({ ticket }) => {
  const images = ticket?.images || [];
  const { doRequest, errors } = useRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket?.id,
    },
    onSuccess: (order) => {
      Router.push('/orders/[orderId]', `/orders/${order.id}`);
    },
  });

  const onClick = () => {
    doRequest();
  };

  if (!ticket) {
    return (
      <section className="page-panel p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Ticket</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Ticket unavailable</h1>
        <p className="mt-3 text-sm text-muted">
          This ticket could not be loaded. It may have been removed or the ticket service may be unavailable.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="page-panel overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="border-b border-line bg-slate-50 p-4 lg:border-b-0 lg:border-r">
            {images.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image, index) => (
                  <img
                    key={image}
                    src={image.startsWith('https://') ? image : `/uploads/${image}`}
                    className="aspect-[4/3] w-full rounded-md border border-line bg-white object-cover"
                    alt={`Ticket Image ${index + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed border-line bg-white px-6 text-center">
                <div>
                  <p className="text-sm font-medium text-ink">No ticket images</p>
                  <p className="mt-2 text-sm text-muted">Images added by the seller will appear here.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-brand">Ticket</p>
            <h1 className="mt-2 text-3xl font-semibold text-ink">{ticket.title}</h1>
            <p className="mt-4 text-sm text-muted">Current listing price</p>
            <p className="mt-1 text-4xl font-semibold text-ink">${ticket.price.toFixed(2)}</p>

            <button className="btn-primary mt-6 w-full sm:w-auto" onClick={onClick}>
              Purchase ticket
            </button>

            {errors && <div className="mt-5">{errors}</div>}
          </div>
        </div>
      </div>
    </section>
  );
};

TicketShow.getInitialProps = async (context, client) => {
  const { ticketId } = context.query;
  try {
    const { data } = await client.get(`/api/tickets/${ticketId}`);

    return { ticket: data };
  } catch (err) {
    return { ticket: null };
  }
};

export default TicketShow;
