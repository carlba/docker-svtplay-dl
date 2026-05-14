import { HTTPError, RequestError, TimeoutError } from 'got';

export function handleGotError(error: unknown, label: string, action: 'silence'): false;
export function handleGotError(error: unknown, label: string, action: 'throw'): never;
export function handleGotError(
  error: unknown,
  label: string,
  action: 'silence' | 'throw'
): false | never {
  if (error instanceof HTTPError) {
    const statusCode = error.response.statusCode;
    const body = error.response.body;
    const message = `API error while ${label}:${statusCode}: ${JSON.stringify(body)}`;
    if (action === 'throw') {
      throw new Error(message);
    }
    console.error(message);
    return false;
  }

  if (error instanceof TimeoutError) {
    const message = `Request timed out while ${label} at phase: ${error.event}`;
    if (action === 'throw') {
      throw new Error(message);
    }
    console.error(message);
    return false;
  }

  if (error instanceof RequestError) {
    const message = `Network error while ${label}:[${error.code}]: ${error.message}`;
    if (action === 'throw') {
      throw new Error(message);
    }
    console.error(message);
    return false;
  }

  if (action === 'throw') {
    console.error(error);
    throw error;
  }

  return false;
}
