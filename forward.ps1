# Get the name of a pod starting with "nats-depl" in the default namespace
$POD_NAME = kubectl get pods -n default --selector=app=nats -o jsonpath='{.items[0].metadata.name}'

# Check if POD_NAME is empty
if (-not $POD_NAME) {
  Write-Host "No pod found with the name starting with 'nats-depl' in the default namespace."
  exit 1
}

# Start port forwarding for the selected pod
kubectl port-forward $POD_NAME 4222:4222

