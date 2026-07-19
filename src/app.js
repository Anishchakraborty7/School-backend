import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Security Middlewares
app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null,
    errors: ['Rate limit exceeded']
  }
});
app.use(limiter);

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - static path: ${path.join(process.cwd(), 'uploads')}`);
  next();
});

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Base Route for Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School Management System API is healthy',
    data: { timestamp: new Date() },
    errors: null
  });
});

// App Routes
app.use('/', routes);

// 404 Route handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler
app.use(errorHandler);

export default app;
