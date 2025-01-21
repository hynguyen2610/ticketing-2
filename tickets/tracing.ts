import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { trace } from '@opentelemetry/api';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { Resource } from '@opentelemetry/resources';

// Create an OTLP exporter (gRPC or HTTP)
const exporter = new JaegerExporter({
  endpoint: 'http://jaeger-collector.default.svc.cluster.local:14268/api/traces',
});

// Set up the Tracer provider with service name attribute
const provider = new NodeTracerProvider({
  resource: new Resource({
    'service.name': 'ticket-service', // Set the service name
  }),
});
// Add the OTLP exporter to the Span Processor
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

// Register the Tracer provider globally
provider.register();

// Optionally, enable HTTP instrumentation (for outgoing HTTP requests)
new HttpInstrumentation().enable();

// Export the tracer instance
const tracer = trace.getTracer('ticket-service');

export { tracer };

