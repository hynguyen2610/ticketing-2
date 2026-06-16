There is no ingress-nginx dependency for this deployment.
The app uses direct service routing and NodePort/LoadBalancer service exposure instead.

Need to install react-stripe-checkout
```
npm install react-stripe-checkout
```
Add `NEXT_PUBLIC_STRIPE_PUB_KEY` to the same Kubernetes `stripe-secret` used by
the payment service. The publishable key and `STRIPE_KEY` must come from the
same Stripe account and mode.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: stripe-secret
  namespace: default
type: Opaque
stringData:
  STRIPE_KEY: <your-stripe-secret-key>
  NEXT_PUBLIC_STRIPE_PUB_KEY: <your-stripe-publishable-key>
```
Stripe Checkout need prop-types to work (as dependency)
```
npm install prop-types
```
