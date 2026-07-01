import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { BotsService } from '../bots/bots.service';
import { CreateBotDto, UpdateBotDto } from './dto/bot.dto';

@UseGuards(AdminGuard)
@Controller('admin/bots')
export class BotsAdminController {
  constructor(private readonly bots: BotsService) {}

  @Get()
  list() {
    return this.bots.list();
  }

  @Post()
  create(@Body() dto: CreateBotDto) {
    return this.bots.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBotDto) {
    return this.bots.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bots.remove(id);
  }
}
