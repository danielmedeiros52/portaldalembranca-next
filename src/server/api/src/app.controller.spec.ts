import { describe, expect, it } from 'vitest';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  it('returns health payload', () => {
    const controller = new AppController(new AppService());
    const response = controller.getHealth();

    expect(response.status).toBe('ok');
    expect(typeof response.timestamp).toBe('string');
  });
});
