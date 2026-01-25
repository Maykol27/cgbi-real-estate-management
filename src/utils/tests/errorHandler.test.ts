import { describe, it, expect } from 'vitest';
import { tryCatch, AppError } from '../errorHandler';

describe('errorHandler', () => {
    describe('tryCatch', () => {
        it('should return data when promise resolves', async () => {
            const successPromise = Promise.resolve('Success');
            const [data, error] = await tryCatch(successPromise);

            expect(data).toBe('Success');
            expect(error).toBeNull();
        });

        it('should return AppError when promise rejects', async () => {
            const failPromise = Promise.reject(new Error('Fail'));
            const [data, error] = await tryCatch(failPromise);

            expect(data).toBeNull();
            expect(error).toBeInstanceOf(AppError);
            expect(error?.message).toBe('Fail');
        });
    });
});
