import useRequest from '../../hooks/use-request'

const TicketShow = ({ ticket }) => {
  const { doRequest, errors } = useRequest({
    url: '/api/orders',
    method: 'post',
    body: {
      ticketId: ticket.id
    },
    onSuccess: (order) => console.log(order)
  });

  const onClick = () => {
    doRequest();
  }

  return (<div>
    <h1>TicketShow</h1>
    <div className="container">
      <div className="row">
        <div className="col">
          <div className="row">
            <div className="col">
              <strong>Title:</strong>
            </div>
            <div className="col">{ticket.title}</div>
          </div>
          <div className="row">
            <div className="col">
              <strong>Price:</strong>
            </div>
            <div className="col">{ticket.price}</div>
          </div>
          <div className="row">
            {errors}
          </div>
          <div className="row">
            <div className="col">
              <button className="btn btn-primary" onClick={onClick}>Purchase</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>)
};

TicketShow.getInitialProps = async (context, client) => {
  const { ticketId } = context.query;
  const { data } = await client.get(`/api/tickets/${ticketId}`);

  return { ticket: data };
}

export default TicketShow;