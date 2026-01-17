import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtPayload } from './auth.service';

/**
 * Optional JWT Guard
 * Attempts to validate JWT token if present, but doesn't throw error if missing
 * Useful for endpoints that work both with and without authentication
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context
            .switchToHttp()
            .getRequest<Request & { user?: JwtPayload }>();

        let token: string | undefined;

        if (request.cookies && request.cookies['jwt']) {
            token = request.cookies['jwt'];
        }

        // If no token, just continue without setting user
        if (!token) {
            return true;
        }

        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(token);
            request.user = payload;
            return true;
        } catch {
            // Token is invalid, but we still allow the request
            return true;
        }
    }
}
