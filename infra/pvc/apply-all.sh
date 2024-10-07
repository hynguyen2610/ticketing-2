# Due to Skaffold will delete all linked PVs even if
# the data Policy is Retain, these pvs must be
# managed manually out of Skaffold.
kubectl apply -f .