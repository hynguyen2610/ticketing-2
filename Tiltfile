REGISTRY = '100.114.61.78:30500/ticketing'

allow_k8s_contexts('kubernetes-admin@kubernetes')

config.define_string('client-port')
tilt_config = config.parse()
CLIENT_PORT = tilt_config.get('client-port', '13100')

default_registry(REGISTRY)

app_manifests = [
  './infra/k8s-apps/auth-depl.yaml',
  './infra/k8s-apps/client-depl.yaml',
  './infra/k8s-apps/expiration-depl.yaml',
  './infra/k8s-apps/image-management-backend-depl.yaml',
  './infra/k8s-apps/image-management-frontend-depl.yaml',
  './infra/k8s-apps/orders-depl.yaml',
  './infra/k8s-apps/payment-depl.yaml',
  './infra/k8s-apps/tickets-depl.yaml',
]

system_infra_deps = [
  './scripts/system-infra.sh',
  './infra/pvc/static-pvs.yaml',
  './infra/pvc/auth-mongo-pvc.yaml',
  './infra/pvc/image-managements-mongo-pvc.yaml',
  './infra/pvc/orders-mongo-pvc.yaml',
  './infra/pvc/payment-mongo-pvc.yaml',
  './infra/pvc/tickets-mongo-pvc.yaml',
  './infra/pvc/upload-storage-pvc.yaml',
  './infra/k8s-system/auth-mongo-depl.yaml',
  './infra/k8s-system/expiration-redis-depl.yaml',
  './infra/k8s-system/image-management-mongo-depl.yaml',
  './infra/k8s-system/jeager-depl.yaml',
  './infra/k8s-system/nats-depl.yaml',
  './infra/k8s-system/orders-mongo-depl.yaml',
  './infra/k8s-system/payment-mongo-depl.yaml',
  './infra/k8s-system/tickets-mongo-depl.yaml',
]

local_resource(
  'system-infra',
  'scripts/system-infra.sh up',
  deps=system_infra_deps,
)

k8s_yaml(app_manifests)

node_dependency_files = [
  'package.json',
  'package-lock.json',
  'Dockerfile',
]

def node_service(image, context):
  docker_build(
    image,
    context,
    dockerfile=context + '/Dockerfile',
    live_update=[
      fall_back_on([context + '/' + f for f in node_dependency_files]),
      sync(context + '/src', '/app/src'),
    ],
  )

node_service('bluestorm1288/ticketing-auth', './auth')
node_service('bluestorm1288/ticketing-tickets', './tickets')
node_service('bluestorm1288/ticketing-orders', './orders')
node_service('bluestorm1288/ticketing-expiration', './expiration')
node_service('bluestorm1288/ticketing-payment', './payment')
node_service('bluestorm1288/image-management-backend', './image-management/backend')

docker_build(
  'bluestorm1288/ticketing-client',
  './client',
  dockerfile='./client/Dockerfile',
  live_update=[
    fall_back_on([
      './client/package.json',
      './client/package-lock.json',
      './client/Dockerfile',
      './client/next.config.js',
    ]),
    sync('./client/api', '/app/api'),
    sync('./client/components', '/app/components'),
    sync('./client/hooks', '/app/hooks'),
    sync('./client/lib', '/app/lib'),
    sync('./client/pages', '/app/pages'),
    sync('./client/pics', '/app/pics'),
    sync('./client/resources', '/app/resources'),
    sync('./client/tailwind.config.js', '/app/tailwind.config.js'),
    sync('./client/postcss.config.js', '/app/postcss.config.js'),
  ],
)

docker_build(
  'bluestorm1288/iman-front',
  './image-management/frontend',
  dockerfile='./image-management/frontend/Dockerfile',
  live_update=[
    fall_back_on([
      './image-management/frontend/package.json',
      './image-management/frontend/package-lock.json',
      './image-management/frontend/Dockerfile',
    ]),
    sync('./image-management/frontend/src', '/app/src'),
    sync('./image-management/frontend/public', '/app/public'),
    run('npm run build', trigger=[
      './image-management/frontend/src',
      './image-management/frontend/public',
    ]),
  ],
)

k8s_resource('auth-depl', labels=['services'], resource_deps=['system-infra'])
k8s_resource('tickets-depl', labels=['services'], resource_deps=['system-infra'])
k8s_resource('orders-depl', labels=['services'], resource_deps=['system-infra'])
k8s_resource('expiration-depl', labels=['workers'], resource_deps=['system-infra'])
k8s_resource('payment-depl', labels=['services'], resource_deps=['system-infra'])
k8s_resource('image-management-backend-depl', labels=['image-management'], resource_deps=['system-infra'])
k8s_resource('image-management-frontend-depl', labels=['image-management'], resource_deps=['system-infra'])
k8s_resource('client-depl', port_forwards=[CLIENT_PORT + ':3000'], labels=['frontend'], resource_deps=['system-infra'])
