Create a Kubernetes secret for Stripe keys.

`STRIPE_KEY` is the server-side secret key used by the payment service.
`NEXT_PUBLIC_STRIPE_PUB_KEY` is the publishable key used by the client.
Both keys must come from the same Stripe account and mode. Do not mix a
`pk_test_...` key from one account with an `sk_test_...` key from another.

```
kubectl create secret generic stripe-secret \
  --from-literal=STRIPE_KEY=<your-stripe-secret-key> \
  --from-literal=NEXT_PUBLIC_STRIPE_PUB_KEY=<your-stripe-publishable-key>
```

You can also copy `infra/examples/stripe-secret.example.yaml`, replace the
placeholder values locally, and apply it.

Install stripe
```
npm install stripe
```
