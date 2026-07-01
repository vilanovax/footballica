import {
  Injectable,
  Inject,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';

const OTP_TTL_SEC = 120;
const OTP_PREFIX = 'otp:';

export interface PublicUser {
  id: string;
  phone: string;
  name: string | null;
  avatar: string | null;
  level: number;
  xp: number;
  coins: number;
  lives: number;
}

export interface JwtPayload {
  sub: string;
  phone: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  private get isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  // ---------- درخواستِ کدِ یک‌بارمصرف ----------
  async requestOtp(
    phone: string,
  ): Promise<{ sent: boolean; ttl: number; devCode?: string }> {
    // کدِ ۶ رقمی
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.set(`${OTP_PREFIX}${phone}`, code, 'EX', OTP_TTL_SEC);

    // TODO(agent/فاز۱): ارسال واقعی از طریق پنلِ پیامکِ ایرانی (کاوه‌نگار/…)
    // فعلاً در محیطِ توسعه کد را لاگ می‌کنیم و در پاسخ برمی‌گردانیم.
    if (!this.isProd) {
      // eslint-disable-next-line no-console
      console.log(`📲 OTP برای ${phone}: ${code}`);
    }

    return {
      sent: true,
      ttl: OTP_TTL_SEC,
      ...(this.isProd ? {} : { devCode: code }),
    };
  }

  // ---------- تأییدِ کد و صدور توکن ----------
  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ token: string; user: PublicUser }> {
    const key = `${OTP_PREFIX}${phone}`;
    const stored = await this.redis.get(key);
    if (!stored) throw new BadRequestException('کد منقضی شده؛ دوباره درخواست بده');
    if (stored !== code) throw new UnauthorizedException('کدِ تأیید نادرست است');

    await this.redis.del(key); // یک‌بارمصرف

    // کاربر را بساز یا بیاور (ورود = ثبت‌نامِ ضمنی)
    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name: null },
    });

    const token = await this.jwt.signAsync({
      sub: user.id,
      phone: user.phone,
    } satisfies JwtPayload);

    return { token, user: toPublicUser(user) };
  }

  // ---------- اعتبارسنجیِ توکن (برای گارد) ----------
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
  }

  async getUserById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    return toPublicUser(user);
  }
}

export function toPublicUser(u: User): PublicUser {
  return {
    id: u.id,
    phone: u.phone,
    name: u.name,
    avatar: u.avatar,
    level: u.level,
    xp: u.xp,
    coins: u.coins,
    lives: u.lives,
  };
}
