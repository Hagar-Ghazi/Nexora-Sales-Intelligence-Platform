import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from functools import wraps

def setup_tracing():
    """
    Initializes OpenTelemetry tracing.
    LangSmith is enabled via environment variables (LANGCHAIN_TRACING_V2),
    this is for tracing non-LLM backend components (DB, Cache, etc.) to Jaeger.
    """
    provider = TracerProvider()
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4317", insecure=True))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

def span_decorator(name: str):
    """Decorator to easily trace any python function."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)
            with tracer.start_as_current_span(name):
                return func(*args, **kwargs)
        return wrapper
    return decorator
