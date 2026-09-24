export async function retryOperation(
  operation,
  { attempts, intervalMs, wait = pause }
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(intervalMs);
      }
    }
  }

  throw lastError;
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
