import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';
import Router from 'next/router';

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const { doRequest, errors } = useRequest({
    url: '/api/payment',
    method: 'post',
    body: {
      orderId: order?.id
    },
    onSuccess: (payment) => {
      Router.push('/orders');
    }
  });

  useEffect(() => {
    if (!order) {
      return undefined;
    }

    const findTimeLeft = () => {
      const msLeft = new Date(order.expiresAt) - new Date();
      setTimeLeft(Math.round(msLeft / 1000));
    };

    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [order]);

  if (!order) {
    return (
      <section className="page-panel p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Order</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Order unavailable</h1>
        <p className="mt-3 text-sm text-muted">
          This order could not be loaded. It may require sign-in or may no longer exist.
        </p>
      </section>
    );
  }
  if (timeLeft < 0) {
    return <div>Order Expired</div>;
  }

  return (
    <div>
      Time left to pay: {timeLeft} seconds
      <StripeCheckout
        token={({ id }) => doRequest({ token: id })}
        stripeKey='pk_test_51PKzfgP3zyoINj4w3m7CzP4DMK1J0CIEFGvY4oeqEJ4RE6XakKfmOu13RR7MTPEHFndcmkdtyyNDqcBspIfO0niF00C8E3NpgD'
        amount={order.ticket.price * 100}
        email={currentUser?.email || ''}
      />
      {errors}
    </div>
  );
};

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  try {
    const { data } = await client.get(`/api/orders/${orderId}`);

    return { order: data };
  } catch (err) {
    return { order: null };
  }
};

export default OrderShow;
