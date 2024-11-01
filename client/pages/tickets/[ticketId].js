import Router from 'next/router';
import useRequest from '../../hooks/use-request';

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
    <div className="container mt-5">
      <h3>{ticket.title}</h3>
      <h6 className="text-muted">Price: ${ticket.price.toFixed(2)}</h6>
      <button className="btn btn-primary" onClick={onClick}>
        Purchase
      </button>

      <div className="row mt-4">
        {ticket.images.map((image, index) => (
          <div className="col-md-4 mb-4" key={image}>
            <img
              src={image.startsWith('https://') ? image : `/uploads/${image}`}
              className="img-fluid"
              alt={`Ticket Image ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {errors && <div className="alert alert-danger mt-3">{errors}</div>}
    </div>
  );
};

TicketShow.getInitialProps = async (context, client) => {
  const { ticketId } = context.query;
  const { data } = await client.get(`/api/tickets/${ticketId}`);

  return { ticket: data };
};

export default TicketShow;
