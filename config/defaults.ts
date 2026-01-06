export const defaults = {
  service: {
    name: 'modulith-dx',
    version: '0.0.1',
    namespace: 'modulith',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  observability: {
    otlp: {
      endpoint: 'http://localhost:4318',
    },
  },
  logging: {
    level: 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },
} as const;
