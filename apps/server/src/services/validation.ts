import type { Validator, ValidationResult } from '@the-heist/shared';

export class ValidationService {
  async validate(containerId: string, validator: Validator): Promise<ValidationResult> {
    void containerId;
    void validator;
    // TODO: run validator against container
    return { passed: false, feedback: 'Not implemented' };
  }
}
