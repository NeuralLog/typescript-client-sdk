/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EndpointResponse } from '../models/EndpointResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class EndpointsService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Get service endpoints
     * Get the service endpoints for a tenant
     * @param tenant Tenant ID (if not provided, uses the tenant ID from the registry configuration)
     * @returns EndpointResponse Service endpoints
     * @throws ApiError
     */
    public getEndpoints(
tenant?: string,
): CancelablePromise<EndpointResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/endpoints',
            query: {
                'tenant': tenant,
            },
            errors: {
                400: `Bad request`,
                500: `Internal server error`,
            },
        });
    }

}
