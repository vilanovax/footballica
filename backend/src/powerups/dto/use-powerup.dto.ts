import { IsIn } from 'class-validator';
import type { PowerupType } from '../powerup.constants';

export class UsePowerupDto {
  @IsIn(['fifty', 'extra_time', 'swap'], {
    message: 'نوعِ پاورآپ نامعتبر است',
  })
  type!: PowerupType;

  // پرداخت با کارت یا سکه
  @IsIn(['card', 'coin'], { message: 'روشِ پرداخت باید card یا coin باشد' })
  pay!: 'card' | 'coin';
}
