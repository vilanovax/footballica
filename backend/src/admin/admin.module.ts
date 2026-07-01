import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { QuestionsAdminService } from './questions.admin.service';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AdminController],
  providers: [QuestionsAdminService, AdminGuard],
})
export class AdminModule {}
