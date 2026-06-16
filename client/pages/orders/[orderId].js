import { useEffect, useState } from 'react';
import StripeCheckout from 'react-stripe-checkout';
import useRequest from '../../hooks/use-request';
import Router from 'next/router';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUB_KEY;

const OrderShow = ({ order, currentUser }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  const { doRequest, errors } = useRequest({
    url: '/api/payment',
    method: 'post',
    body: {
      orderId: order?.id,
    },
    onSuccess: (payment) => {
      Router.push('/orders');
    },
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
    return (
      <section className="page-panel p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Order</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Order expired</h1>
        <p className="mt-3 text-sm text-muted">
          This reservation has expired. Return to the marketplace to choose another ticket.
        </p>
      </section>
    );
  }

  return (
    <section className="page-panel overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
        <div className="border-b border-line p-6 lg:border-b-0 lg:border-r">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Checkout</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{order.ticket.title}</h1>
          <p className="mt-4 text-sm text-muted">Reservation price</p>
          <p className="mt-1 text-4xl font-semibold text-ink">${order.ticket.price.toFixed(2)}</p>
        </div>

        <div className="bg-slate-50 p-6">
          <div className="rounded-md border border-line bg-white p-5">
            <p className="text-sm font-medium text-muted">Time left to pay</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{timeLeft} seconds</p>
            <p className="mt-3 text-sm text-muted">
              Complete payment before the reservation expires.
            </p>

            {stripePublishableKey ? (
              <div className="mt-6">
                <StripeCheckout
                  token={({ id }) => doRequest({ token: id })}
                  stripeKey={stripePublishableKey}
                  amount={Math.round(order.ticket.price * 100)}
                  email={currentUser?.email || ''}
                  label="Pay with card"
                  panelLabel="Pay"
                  className="btn-primary w-full"
                />
              </div>
            ) : (
              <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                Stripe publishable key is not configured.
              </p>
            )}

            {errors && <div className="mt-5">{errors}</div>}
          </div>
        </div>
      </div>
    </section>
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
