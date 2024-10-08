import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css'; 

const LandingPage = ({ currentUser, tickets }) => {
  const ticketList = tickets.map((ticket) => {
    return (
      <tr key={ticket.id}>
        <td>{ticket.title}</td>
        <td>{ticket.price}</td>
        <td><Link href="tickets/[ticketId]" as={`/tickets/${ticket.id}`}>Show</Link></td>
      </tr>
    );
  });

  return (
    <div>
      <h1>Tickets showcase</h1>
      <Link href="/tickets/new">
       Add ticket
      </Link>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>{ticketList}</tbody>
      </table>
    </div>
  );
};

LandingPage.getInitialProps = async (context, client, currentUser) => {
  const { data } = await client.get('/api/tickets');

  return { tickets: data };
};

export default LandingPage;
