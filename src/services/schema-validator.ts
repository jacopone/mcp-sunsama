import { TaskSchema, type Task } from '../models/task.js';
import { UserSchema, type User } from '../models/user.js';
import { ChannelSchema, type Channel } from '../models/channel.js';
import { ZodError } from 'zod';

/**
 * Schema validation service for Sunsama API responses
 * Implements resilient error handling for undocumented API (Constitution Principle III)
 */

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate task response from Sunsama API
 */
export function validateTaskResponse(data: unknown): ValidationResult<Task> {
  try {
    const validated = TaskSchema.parse(data);
    return {
      success: true,
      data: validated as unknown as Task
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate user response from Sunsama API
 */
export function validateUserResponse(data: unknown): ValidationResult<User> {
  try {
    const validated = UserSchema.parse(data);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate channel/stream response from Sunsama API
 */
export function validateChannelResponse(data: unknown): ValidationResult<Channel> {
  try {
    const validated = ChannelSchema.parse(data);
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate array of tasks
 */
export function validateTaskArrayResponse(data: unknown): ValidationResult<Task[]> {
  try {
    if (!Array.isArray(data)) {
      return {
        success: false,
        errors: ['Expected array of tasks']
      };
    }

    const validated = data.map(item => TaskSchema.parse(item)) as unknown as Task[];
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Validate array of channels
 */
export function validateChannelArrayResponse(data: unknown): ValidationResult<Channel[]> {
  try {
    if (!Array.isArray(data)) {
      return {
        success: false,
        errors: ['Expected array of channels']
      };
    }

    const validated = data.map(item => ChannelSchema.parse(item));
    return {
      success: true,
      data: validated
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
    return {
      success: false,
      errors: ['Unknown validation error']
    };
  }
}

/**
 * Log validation errors for debugging API schema changes
 * (Constitution Principle V: Maintainability & Documentation)
 */
export function logValidationError(
  endpoint: string,
  data: unknown,
  errors: string[]
): void {
  console.error('[Schema Validator] API schema change detected');
  console.error(`Endpoint: ${endpoint}`);
  console.error(`Errors: ${errors.join(', ')}`);
  console.error(`Response data:`, JSON.stringify(data, null, 2));
}
