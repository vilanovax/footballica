import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest } from './jwt-auth.guard';
import type { JwtPayload } from './auth.service';

/**
 * استخراجِ payloadِ کاربرِ احرازشده از درخواست (بعد از JwtAuthGuard).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user) throw new Error('CurrentUser بدون JwtAuthGuard استفاده شد');
    return req.user;
  },
);
