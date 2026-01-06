#!/usr/bin/env node

/**
 * Demo script showing OpenTelemetry trace emission
 * Run with: tsx scripts/tracing-demo.ts
 */

import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('demo-tracer', '1.0.0');

async function main(): Promise<void> {
  const span = tracer.startSpan('demo-operation');
  
  try {
    span.setAttribute('demo.attribute', 'hello-world');
    span.addEvent('Processing started');
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    span.addEvent('Processing completed');
    span.setStatus({ code: 0 });
  } catch (error) {
    span.setStatus({ code: 2, message: String(error) });
    throw error;
  } finally {
    span.end();
  }
}

main().catch(console.error);
