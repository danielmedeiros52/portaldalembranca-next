import { Logger } from './framework/nest-like';
import { NestFactory } from './framework/nest-like';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api');
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`HTTP server listening on http://localhost:${port}`);
}

void bootstrap();
