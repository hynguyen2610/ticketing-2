Create a k8s secret for storing stripe public API key
```
kubectl create secret generic stripe-secret --from-literal=STRIPE_KEY=stripe_secret_key
```
Install stripe
```
npm install stripe
```