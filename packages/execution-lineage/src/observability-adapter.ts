import {
  context as otelContext,
  isSpanContextValid,
  trace,
  type Context as OTelContext,
} from "@opentelemetry/api";
import type { ActivityTelemetryCorrelation } from "./contracts.js";

export type LineageTelemetryContext = OTelContext;

export function activeTelemetryContext(): LineageTelemetryContext {
  return otelContext.active();
}

export function withTelemetryContext<T>(
  context: LineageTelemetryContext,
  operation: () => T,
): T {
  return otelContext.with(context, operation);
}

export function projectTelemetryCorrelation(
  context: LineageTelemetryContext,
): ActivityTelemetryCorrelation | undefined {
  const spanContext = trace.getSpanContext(context);
  if (!spanContext || !isSpanContextValid(spanContext)) return undefined;
  return Object.freeze({
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags,
  });
}
