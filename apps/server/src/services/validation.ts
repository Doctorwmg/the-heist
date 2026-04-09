import type { Validator, ValidationResult } from '@the-heist/shared';
import { ExecutionService } from './execution';

const execution = new ExecutionService();

export class ValidationService {
  async validate(
    containerId: string,
    validator: Validator,
    submitted?: string,
  ): Promise<ValidationResult> {
    switch (validator.type) {
      case 'command_output_match':
        return this.validateCommandOutput(containerId, validator);
      case 'file_exists':
        return this.validateFileExists(containerId, validator);
      case 'file_hash_match':
        return this.validateFileHash(containerId, validator);
      case 'query_result_match':
        return this.validateQueryResult(containerId, validator);
      case 'answer_match':
        return this.validateAnswerMatch(validator, submitted);
      case 'file_permissions_match':
        return this.validateFilePermissions(containerId, validator);
      case 'json_schema_match':
        return this.validateJsonSchema(containerId, validator);
      case 'model_accuracy_threshold':
        return this.validateModelAccuracy(containerId, validator);
      default:
        return { passed: false, feedback: `Unknown validator type: ${(validator as Validator).type}` };
    }
  }

  private async validateCommandOutput(
    containerId: string,
    validator: Validator,
  ): Promise<ValidationResult> {
    const command = validator.command as string[] | string;
    const expected = validator.expected as string | undefined;
    const expectedPattern = validator.expected_pattern as string | undefined;
    const mode = (validator.mode as string) ?? 'contains';

    // Support both string and array command formats
    const cmdArgs = Array.isArray(command)
      ? command
      : ['bash', '-c', command];

    const { stdout, exitCode } = await execution.execInContainer(containerId, cmdArgs);
    const output = stdout.trim();
    let passed = false;

    if (expectedPattern) {
      // Regex pattern match
      passed = new RegExp(expectedPattern).test(output);
    } else if (expected) {
      if (mode === 'exact') {
        passed = output === expected;
      } else if (mode === 'regex') {
        passed = new RegExp(expected).test(output);
      } else {
        passed = output.includes(expected);
      }
    } else {
      // Just check exit code
      passed = exitCode === 0;
    }

    return {
      passed,
      feedback: passed
        ? 'Command output matches expected result.'
        : `Output did not match expected pattern.`,
      details: { exitCode, output: output.slice(0, 500) },
    };
  }

  private async validateFileExists(
    containerId: string,
    validator: Validator,
  ): Promise<ValidationResult> {
    const path = validator.path as string;
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
    validator: Validator,
  ): Promise<ValidationResult> {
    const path = validator.path as string;
    const expectedHash = validator.hash as string;
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
    validator: Validator,
  ): Promise<ValidationResult> {
    const query = validator.query as string;
    const expectedValue = (validator.expected_value ?? validator.expected) as string;
    const database = (validator.database as string) ?? 'novapay';
    const tolerance = (validator.tolerance as number) ?? 0;

    const { stdout, stderr } = await execution.execInContainer(containerId, [
      'psql',
      '-U', 'novapay_app',
      '-d', database,
      '-t', '-A',
      '-c', query,
    ]);

    const output = stdout.trim();
    let passed = false;

    if (tolerance > 0) {
      const actual = parseFloat(output);
      const expected = parseFloat(expectedValue);
      passed = !isNaN(actual) && !isNaN(expected) && Math.abs(actual - expected) <= tolerance;
    } else {
      passed = output === expectedValue.trim();
    }

    return {
      passed,
      feedback: passed
        ? 'Query result matches expected output.'
        : `Query returned "${output.slice(0, 200)}" but expected "${expectedValue.slice(0, 200)}"`,
      details: { output: output.slice(0, 500), stderr: stderr.slice(0, 200) },
    };
  }

  private validateAnswerMatch(
    validator: Validator,
    submitted?: string,
  ): Promise<ValidationResult> {
    const expected = (validator.expected as string).trim();
    const caseSensitive = validator.case_sensitive as boolean ?? false;
    const toleranceType = validator.tolerance_type as string | undefined;
    const toleranceRange = validator.tolerance_range as number[] | undefined;
    const answer = (submitted ?? '').trim();

    let passed = false;

    if (toleranceType === 'range' && toleranceRange) {
      // Numeric range check
      const num = parseFloat(answer);
      passed = !isNaN(num) && num >= toleranceRange[0] && num <= toleranceRange[1];
    } else if (caseSensitive) {
      passed = answer === expected;
    } else {
      passed = answer.toLowerCase() === expected.toLowerCase();
    }

    return Promise.resolve({
      passed,
      feedback: passed ? 'Correct answer!' : 'Incorrect answer. Try again.',
    });
  }

  private async validateFilePermissions(
    containerId: string,
    validator: Validator,
  ): Promise<ValidationResult> {
    const path = validator.path as string;
    const expected = validator.permissions as string;
    const { stdout } = await execution.execInContainer(containerId, [
      'stat',
      '-c', '%a',
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
    validator: Validator,
  ): Promise<ValidationResult> {
    const path = validator.path as string;
    const schema = validator.schema as {
      required_fields?: string[];
      field_checks?: Record<string, {
        type?: string;
        min?: number;
        max?: number;
        min_length?: number;
      }>;
    } | undefined;

    // Build a Python validation script that checks the JSON structure
    const checks: string[] = [
      `import json, sys`,
      `try:`,
      `    data = json.load(open("${path}"))`,
      `except Exception as e:`,
      `    print(f"INVALID_JSON: {e}")`,
      `    sys.exit(1)`,
    ];

    if (schema?.required_fields) {
      for (const field of schema.required_fields) {
        checks.push(`if "${field}" not in data:`);
        checks.push(`    print("MISSING_FIELD: ${field}")`);
        checks.push(`    sys.exit(1)`);
      }
    }

    if (schema?.field_checks) {
      for (const [field, check] of Object.entries(schema.field_checks)) {
        if (check.type === 'number') {
          checks.push(`val = data.get("${field}")`);
          checks.push(`if not isinstance(val, (int, float)):`);
          checks.push(`    print("TYPE_ERROR: ${field} must be a number")`);
          checks.push(`    sys.exit(1)`);
          if (check.min !== undefined) {
            checks.push(`if val < ${check.min}:`);
            checks.push(`    print("RANGE_ERROR: ${field} too low")`);
            checks.push(`    sys.exit(1)`);
          }
          if (check.max !== undefined) {
            checks.push(`if val > ${check.max}:`);
            checks.push(`    print("RANGE_ERROR: ${field} too high")`);
            checks.push(`    sys.exit(1)`);
          }
        }
        if (check.type === 'array') {
          checks.push(`val = data.get("${field}")`);
          checks.push(`if not isinstance(val, list):`);
          checks.push(`    print("TYPE_ERROR: ${field} must be an array")`);
          checks.push(`    sys.exit(1)`);
          if (check.min_length !== undefined) {
            checks.push(`if len(val) < ${check.min_length}:`);
            checks.push(`    print("LENGTH_ERROR: ${field} too short")`);
            checks.push(`    sys.exit(1)`);
          }
        }
      }
    }

    checks.push(`print("VALID")`);

    const script = checks.join('\n');
    const { stdout, exitCode } = await execution.execInContainer(containerId, [
      'python3', '-c', script,
    ]);

    const output = stdout.trim();
    const passed = exitCode === 0 && output === 'VALID';

    let feedback = 'Valid JSON file with correct structure.';
    if (!passed) {
      if (output.startsWith('INVALID_JSON')) {
        feedback = 'File is not valid JSON.';
      } else if (output.startsWith('MISSING_FIELD')) {
        const field = output.split(': ')[1];
        feedback = `Missing required field: "${field}" in your JSON report.`;
      } else if (output.startsWith('TYPE_ERROR')) {
        feedback = output.split(': ').slice(1).join(': ');
      } else if (output.startsWith('RANGE_ERROR')) {
        feedback = output.split(': ').slice(1).join(': ');
      } else if (output.startsWith('LENGTH_ERROR')) {
        feedback = output.split(': ').slice(1).join(': ');
      } else {
        feedback = 'JSON validation failed.';
      }
    }

    return { passed, feedback };
  }

  private async validateModelAccuracy(
    containerId: string,
    validator: Validator,
  ): Promise<ValidationResult> {
    const script = validator.eval_script as string;
    const threshold = validator.threshold as number;

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
