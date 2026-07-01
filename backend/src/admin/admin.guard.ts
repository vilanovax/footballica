import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * گاردِ سادهٔ ادمین (MVP): هدرِ x-admin-key باید با ADMIN_KEY بخواند.
 * در فازِ بعد می‌توان به نقشِ کاربری (isAdmin روی JWT) ارتقا داد.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-admin-key'];
    const expected = process.env.ADMIN_KEY ?? 'dev-admin-key';
    if (typeof key !== 'string' || key !== expected) {
      throw new UnauthorizedException('کلیدِ ادمین نامعتبر است');
    }
    return true;
  }
}
