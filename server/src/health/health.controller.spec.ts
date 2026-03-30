import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns healthy payload', () => {
    const controller = new HealthController();
    const result = controller.getHealth();

    expect(result.ok).toBe(true);
    expect(result.service).toBe('cofounder-server');
    expect(typeof result.timestamp).toBe('string');
  });
});
