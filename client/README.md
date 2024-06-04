Need to install react-stripe-checkout
```
npm install react-stripe-checkout
```
Add STRIPE_PUB_KEY to k8s secret stripe-secret
```yaml
apiVersion: v1
data:
  STRIPE_KEY: <ENCODED_STRIPE_SECRET_KEY>
  STRIPE_PUB_KEY: <ENCODED_STRIPE_PUB_KEY>
kind: Secret
metadata:
  name: stripe-secret
  namespace: default
type: Opaque
```
Stripe Checkout need prop-types to work (as dependency)
```
npm install prop-types
```