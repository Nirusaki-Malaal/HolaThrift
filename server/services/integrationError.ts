export class IntegrationConfigError extends Error {
  readonly statusCode = 503;

  constructor(message: string) {
    super(message);
    this.name = 'IntegrationConfigError';
  }
}

export const isIntegrationConfigError = (error: unknown): error is IntegrationConfigError => {
  return error instanceof IntegrationConfigError;
};
