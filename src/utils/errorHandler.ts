export class AppError extends Error {
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, code: string = 'UNKNOWN_ERROR', isOperational: boolean = true) {
        super(message);
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    }
}

export const tryCatch = async <T, E = AppError>(promise: Promise<T>): Promise<[T | null, E | null]> => {
    try {
        const data = await promise;
        return [data, null];
    } catch (error: any) {
        const appError = new AppError(error.message || 'Unknown Error', error.code, true) as unknown as E;
        return [null, appError];
    }
};

export const handleError = (error: unknown): string => {
    if (error instanceof AppError) {
        return `[${error.code}] ${error.message}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};
