export const allowedOrigins = [
  'http://localhost:4500',
  'http://localhost:3000',
];

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, origin?: string) => void
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
};

export const socketCorsOptions = {
  origin: corsOptions.origin,
  methods: ['GET', 'POST'],
};
