import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    cors: false,
    bodyParser: false, // Disable default body parser to configure custom limits
  });
  
  // Increase body size limit to 10MB for JSON payloads (base64 images can be large)
  // NestJS uses Express under the hood, so we configure it here
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  
  // Enable CORS with proper preflight handling
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  // Handle OPTIONS preflight requests explicitly
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
      res.header('Access-Control-Max-Age', '86400');
      return res.sendStatus(204);
    }
    next();
  });
  // Bind to localhost by default to avoid permission issues on 0.0.0.0
  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? 'localhost';
  await app.listen(port, host);
  console.log(`🚀 Backend server is running on http://${host}:${port}`);
}
bootstrap();
