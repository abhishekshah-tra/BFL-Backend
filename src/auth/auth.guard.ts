import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly authService: AuthService,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request =
            context.switchToHttp().getRequest();

        const authorization =
            request.headers.authorization;

        if (!authorization) {
            throw new UnauthorizedException(
                'Authorization token is required',
            );
        }

        const [type, token] =
            authorization.split(' ');

        if (
            type !== 'Bearer' ||
            !token
        ) {
            throw new UnauthorizedException(
                'Invalid authorization header',
            );
        }

        let payload: any;

        try {
            payload =
                await this.jwtService.verifyAsync(
                    token,
                );
        } catch {
            throw new UnauthorizedException(
                'Invalid or expired token',
            );
        }

        const user =
            await this.authService.validateAccessToken(
                token,
                payload,
            );

        request.user = {
            ...user,
            sessionId: payload.sid,
            jti: payload.jti,
        };

        return true;
    }
}