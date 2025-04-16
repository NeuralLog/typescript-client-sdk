/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthResponse } from '../models/HealthResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class HealthService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Get health status
     * Get the health status of the registry
     * @returns HealthResponse Health status
     * @throws ApiError
     */
    public getHealth(): CancelablePromise<HealthResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/health',
            errors: {
                500: `Internal server error`,
            },
        });
    }

}
