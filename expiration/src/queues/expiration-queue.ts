import Queue from "bull";

interface PayLoad {
  orderId: string; // Use lowercase 'string' instead of 'String'
}

export const expirationQueue = new Queue<PayLoad>("order:expiration", {
  redis: {
    host: process.env.REDIS_HOST,
  },
});

expirationQueue.process(async (job) => {
  console.log(
    "I want to publish event order:created for orderId",
    job.data.orderId
  );
});
