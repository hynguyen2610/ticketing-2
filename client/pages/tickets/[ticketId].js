import Router from 'next/router';
import useRequest from '../../hooks/use-request';
import TicketCarousel from '../../components/carousel/ticket-carousel';

const TicketShow = ({ ticket }) => {
  const { doRequest, errors } = useRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket.id,
    },
    onSuccess: (order) => {
      Router.push('/orders/[orderId]', `/orders/${order.id}`);
    },
  });

  const onClick = () => {
    doRequest();
  };

  return (
    <>
      <div className="container mt-5">
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ticket Details</h3>
            <h5 className="card-title">Name: <span id="ticket-name">{ticket.title}</span></h5>
            <h6 className="card-subtitle mb-2 text-muted">Price: $<span id="ticket-price">{ticket.price.toFixed(2)}</span></h6>
            <button className="btn btn-primary" onClick={onClick}>
              Purchase
            </button>
          </div>
          <TicketCarousel ticket={ticket} />
        </div>
      </div>

      <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.0.7/dist/umd/popper.min.js"></script>
      <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
    </>
  );
};

TicketShow.getInitialProps = async (context, client) => {
  const { ticketId } = context.query;
  const { data } = await client.get(`/api/tickets/${ticketId}`);

  return { ticket: data };
};

export default TicketShow;
