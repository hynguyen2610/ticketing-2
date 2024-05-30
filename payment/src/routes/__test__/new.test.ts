import mongoose from "mongoose";
import { Order, OrderStatus } from "../../models/order";
import { app } from "../../app";
import request from "supertest";
import { stripeObject } from "../../stripe";

it("return error when order is completed or cancelled", async () => {
  const userId = 'user1';
  const cookie = global.signin(userId);

  // create and save a completed order
  const completedOrder = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Complete,
    version: 0,
    userId: userId,
  });

  await completedOrder.save();

  const responseCompleteOrder = await request(app)
    .post("/api/payment")
    .set("Cookie", cookie)
    .send({ token: "somethingeverything", orderId: completedOrder.id })
    .expect(400);

  // create and save a cancelled order
  const cancelledOrder = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Cancelled,
    version: 0,
    userId: userId,
  });

  await cancelledOrder.save();

  // make a charge for cancelled order
  const responseCancelledOrder = await request(app)
    .post("/api/payment")
    .set("Cookie", cookie)
    .send({ token: "somethingeverything", orderId: cancelledOrder.id })
    .expect(400);
});

it("Make sure the charge request is created by current user", async () => {
  const userId = "happy";

  const cookie = global.signin(userId);

  // create an order by that user
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Created,
    version: 0,
    userId: userId
  });

  await order.save();

  // try to post to payment for that order
  const response = await request(app)
    .post("/api/payment")
    .set("Cookie", global.signin('hanna'))
    .send({ token: "somethingeverything", orderId: order.id })
    .expect(401);
});

it('send correct response code in case of success and fail', async() => {
  const userId = "happy";

  // create an order by that user
  const order = Order.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    price: Math.floor(Math.random() * 10000),
    status: OrderStatus.Created,
    version: 0,
    userId: userId
  });
  await order.save();

  await request(app)
    .post("/api/payment")
    .set("Cookie", global.signin(userId))
    .send({ token: "tok_visa", orderId: order.id })
    .expect(201);
  
  const stripeCharges = await stripeObject.charges.list({ limit: 30 });
  const stripeCharge = stripeCharges.data.find(charge => {
    return charge.amount === order.price * 100
  });

  expect (stripeCharge!.currency).toEqual('usd');
  expect (stripeCharge!.amount).toEqual(order.price * 100);

});