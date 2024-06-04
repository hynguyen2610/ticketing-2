import { useEffect, useState } from "react";

const OrderShow = ({ order }) => {
  const [timeleft, setTimeleft] = useState(0);
  useEffect(() => {
    const findTimeLeft = () => {
      const remainMiliSeconds = new Date(order.expiresAt) - new Date();
      setTimeleft(Math.round(remainMiliSeconds / 1000));
    };

    findTimeLeft();
    const timerId = setInterval(findTimeLeft, 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);


  return <div>{timeleft > 0 ? `${timeleft} seconds until order expires` : 'Expired'}</div>
}

OrderShow.getInitialProps = async (context, client) => {
  const { orderId } = context.query;
  const { data } = await client.get(`/api/orders/${orderId}`);
  return { order: data };
}

export default OrderShow;