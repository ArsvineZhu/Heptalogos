export interface SchemaValidationIssue {
  readonly instancePath: string;
  readonly keyword: string;
  readonly message: string;
}

export type SchemaValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly SchemaValidationIssue[] };

export interface SchemaValidator<T> {
  validate(value: unknown): SchemaValidationResult<T>;
}
