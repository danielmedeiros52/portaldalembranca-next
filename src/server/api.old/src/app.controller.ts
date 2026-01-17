import { Controller, Get } from './framework/nest-like';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService = new AppService()) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
