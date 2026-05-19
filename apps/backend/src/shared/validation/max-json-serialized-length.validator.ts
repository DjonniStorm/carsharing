import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxJsonSerializedLength', async: false })
export class MaxJsonSerializedLengthConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    if (value === undefined || value === null) {
      return true;
    }
    try {
      const max = args.constraints[0] as number;
      return JSON.stringify(value).length <= max;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const max = args.constraints[0] as number;
    return `serialized JSON must be at most ${max} characters`;
  }
}

export function MaxJsonSerializedLength(
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [max],
      validator: MaxJsonSerializedLengthConstraint,
    });
  };
}
