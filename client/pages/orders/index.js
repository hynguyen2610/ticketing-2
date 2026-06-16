const OrderIndex = ({ orders }) => {
  return (
    <section className="page-panel p-6">
      <p className="text-sm font-medium uppercase tracking-wide text-brand">Orders</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">My orders history</h1>
      {orders.length > 0 ? (
        <ul className="mt-5 divide-y divide-line">
          {orders.map((order) => {
            return (
              <li key={order.id} className="py-3 text-sm text-muted">
                <span className="font-medium text-ink">{order.ticket.title}</span> - {order.status}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">
          No orders are available for this session.
        </p>
      )}
    </section>
  )
}

OrderIndex.getInitialProps = async (context, client) => {
  try {
    const { data } = await client.get('/api/orders');
    return { orders: data };
  } catch (err) {
    return { orders: [] };
  }
}

export default OrderIndex;
