import type { Validator, ValidationResult } from '@the-heist/shared';
import { ExecutionService } from './execution';

const execution = new ExecutionService();

export class ValidationService {
  async validate(
    containerId: string,
    validator: Validator,
  ): Promise<ValidationResult> {
    switch (validator.type) {
      case 'command_output_match':
        return this.validateCommandOutput(containerId, validator.config);
      case 'file_exists':
        return this.validateFileExists(containerId, validator.config);
      case 'file_hash_match':
        return this.validateFileHash(containerId, validator.config);
      case 'query_result_match':
        return this.validateQueryResult(containerId, validator.config);
      case 'answer_match':
        return this.validateAnswerMatch(validator.config);
      case 'file_permissions_match':
        return this.validateFilePermissions(containerId, validator.config);
      case 'json_schema_match':
        return this.validateJsonSchema(containerId, validator.config);
      case 'model_accuracy_threshold':
        return this.validateModelAccuracy(containerId, validator.config);
      default:
        return { passed: false, feedback: `Unknown validator type: ${validator.type}` };
    }
  }

  private async validateCommandOutput(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const command = config.command as string;
    const expected = config.expected as string;
    const mode = (config.mode as string) ?? 'contains';

    const { stdout, exitCode } = await execution.execInContainer(containerId, [
      'bash',
      '-c',
      command,
    ]);

    const output = stdout.trim();
    let passed = false;

    if (mode === 'exact') {
      passed = output === expected;
    } else if (mode === 'regex') {
      passed = new RegExp(expected).test(output);
    } else {
      passed = output.includes(expected);
    }

    return {
      passed,
      feedback: passed
        ? 'Command output matches expected result.'
        : `Expected output ${mode === 'exact' ? 'to equal' : 'to contain'} "${expected}", got: "${output.slice(0, 200)}"`,
      details: { exitCode, output: output.slice(0, 500) },
    };
  }

  private async validateFileExists(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const path = config.path as string;
    const { exitCode } = await execution.execInContainer(containerId, [
      'test',
      '-f',
      path,
    ]);
    const passed = exitCode === 0;
    return {
      passed,
      feedback: passed ? `File ${path} exists.` : `File ${path} not found.`,
    };
  }

  private async validateFileHash(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const path = config.path as string;
    const expectedHash = config.hash as string;
    const { stdout } = await execution.execInContainer(containerId, [
      'sha256sum',
      path,
    ]);
    const actualHash = stdout.trim().split(/\s+/)[0] ?? '';
    const passed = actualHash === expectedHash;
    return {
      passed,
      feedback: passed
        ? 'File hash matches.'
        : 'File content does not match expected hash.',
    };
  }

  private async validateQueryResult(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const query = config.query as string;
    const expected = config.expected as string;
    const database = (config.database as string) ?? 'mission_db';

    const { stdout, stderr } = await execution.execInContainer(containerId, [
      'psql',
      '-d',
      database,
      '-t',
      '-A',
      '-c',
      query,
    ]);

    const output = stdout.trim();
    const passed = output === expected.trim();

    return {
      passed,
      feedback: passed
        ? 'Query result matches expected output.'
        : `Query returned "${output.slice(0, 200)}" but expected "${expected.slice(0, 200)}"`,
      details: { output: output.slice(0, 500), stderr: stderr.slice(0, 200) },
    };
  }

  private validateAnswerMatch(
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const expected = (config.expected as string).toLowerCase().trim();
    const submitted = ((config.submitted as string) ?? '').toLowerCase().trim();
    const passed = submitted === expected;
    return Promise.resolve({
      passed,
      feedback: passed ? 'Correct answer!' : 'Incorrect answer. Try again.',
    });
  }

  private async validateFilePermissions(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const path = config.path as string;
    const expected = config.permissions as string;
    const { stdout } = await execution.execInContainer(containerId, [
      'stat',
      '-c',
      '%a',
      path,
    ]);
    const actual = stdout.trim();
    const passed = actual === expected;
    return {
      passed,
      feedback: passed
        ? 'File permissions are correct.'
        : `Expected permissions ${expected}, got ${actual}.`,
    };
  }

  private async validateJsonSchema(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const path = config.path as string;
    const { stdout, exitCode } = await execution.execInContainer(containerId, [
      'python3',
      '-c',
      `import json; json.load(open("${path}"))`,
    ]);
    void stdout;
    const passed = exitCode === 0;
    return {
      passed,
      feedback: passed ? 'Valid JSON file.' : 'Invalid JSON file.',
    };
  }

  private async validateModelAccuracy(
    containerId: string,
    config: Record<string, unknown>,
  ): Promise<ValidationResult> {
    const script = config.eval_script as string;
    const threshold = config.threshold as number;

    const { stdout, stderr, exitCode } = await execution.execInContainer(containerId, [
      'python3',
      script,
    ]);

    if (exitCode !== 0) {
      return {
        passed: false,
        feedback: `Evaluation script failed: ${stderr.slice(0, 200)}`,
      };
    }

    const accuracy = parseFloat(stdout.trim());
    const passed = !isNaN(accuracy) && accuracy >= threshold;
    return {
      passed,
      feedback: passed
        ? `Model accuracy ${(accuracy * 100).toFixed(1)}% meets threshold ${(threshold * 100).toFixed(1)}%.`
        : `Model accuracy ${(accuracy * 100).toFixed(1)}% below threshold ${(threshold * 100).toFixed(1)}%.`,
      details: { accuracy, threshold },
    };
  }
}
