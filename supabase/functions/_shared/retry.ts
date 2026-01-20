export interface RetryOptions {
    retries?: number;
    backoff?: number;
    maxBackoff?: number;
    retryOn?: number[]; // HTTP status codes to retry on
}

const DEFAULT_OPTIONS: RetryOptions = {
    retries: 3,
    backoff: 300,
    maxBackoff: 5000,
    retryOn: [408, 429, 500, 502, 503, 504],
};

export async function fetchWithRetry(
    input: RequestInfo | URL,
    init?: RequestInit,
    options: RetryOptions = {}
): Promise<Response> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let attempt = 0;
    let delay = opts.backoff!;

    while (true) {
        try {
            const response = await fetch(input, init);

            if (response.ok || !opts.retryOn!.includes(response.status)) {
                return response;
            }

            throw new Error(`Request failed with status ${response.status}`);
        } catch (error) {
            attempt++;

            if (attempt > opts.retries!) {
                throw error;
            }

            console.warn(`Attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}. Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));

            delay = Math.min(delay * 2, opts.maxBackoff!);
        }
    }
}
