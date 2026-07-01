import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BotsAdminController } from './bots.admin.controller';
import { QuestionsAdminService } from './questions.admin.service';
import { AdminGuard } from './admin.guard';
import { BotsModule } from '../bots/bots.module';

@Module({
  imports: [BotsModule],
  controllers: [AdminController, BotsAdminController],
  providers: [QuestionsAdminService, AdminGuard],
})
export class AdminModule {}
