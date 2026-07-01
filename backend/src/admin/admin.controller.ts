import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { QuestionsAdminService } from './questions.admin.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateCategoryDto } from './dto/create-category.dto';

@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly questions: QuestionsAdminService) {}

  @Get('overview')
  overview() {
    return this.questions.overview();
  }

  // ---- سؤال‌ها ----
  @Get('questions')
  list(
    @Query('approved') approved?: string,
    @Query('category') category?: string,
  ) {
    const filter: { approved?: boolean; categorySlug?: string } = {};
    if (approved === 'true') filter.approved = true;
    if (approved === 'false') filter.approved = false;
    if (category) filter.categorySlug = category;
    return this.questions.list(filter);
  }

  @Get('questions/:id')
  getOne(@Param('id') id: string) {
    return this.questions.getOne(id);
  }

  @Post('questions')
  create(@Body() dto: CreateQuestionDto) {
    return this.questions.create(dto);
  }

  @Patch('questions/:id')
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questions.update(id, dto);
  }

  @Patch('questions/:id/approve')
  approve(@Param('id') id: string) {
    return this.questions.setApproved(id, true);
  }

  @Patch('questions/:id/unapprove')
  unapprove(@Param('id') id: string) {
    return this.questions.setApproved(id, false);
  }

  @Delete('questions/:id')
  remove(@Param('id') id: string) {
    return this.questions.remove(id);
  }

  // ---- دسته‌بندی‌ها ----
  @Get('categories')
  categories() {
    return this.questions.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.questions.createCategory(dto.name, dto.slug);
  }
}
