import { Module } from './framework/nest-like';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [PaymentsModule],
})
export class AppModule {}
