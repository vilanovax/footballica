import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionOptionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsAdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- فهرست + آمارِ پاسخ‌ها ----------
  async list(filter?: { approved?: boolean; categorySlug?: string }) {
    const where: Prisma.QuestionWhereInput = {};
    if (filter?.approved !== undefined) where.isApproved = filter.approved;
    if (filter?.categorySlug)
      where.category = { slug: filter.categorySlug };

    const questions = await this.prisma.question.findMany({
      where,
      include: {
        options: { orderBy: { order: 'asc' } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // آمارِ پاسخ‌ها به‌ازای هر سؤال (تعداد کل و درست)
    const stats = await this.prisma.answer.groupBy({
      by: ['questionId'],
      _count: { _all: true },
      _sum: { points: true },
    });
    const correct = await this.prisma.answer.groupBy({
      by: ['questionId'],
      where: { isCorrect: true },
      _count: { _all: true },
    });
    const totalById = new Map(stats.map((s) => [s.questionId, s._count._all]));
    const correctById = new Map(
      correct.map((s) => [s.questionId, s._count._all]),
    );

    return questions.map((q) => {
      const total = totalById.get(q.id) ?? 0;
      const ok = correctById.get(q.id) ?? 0;
      return {
        ...q,
        stats: {
          answered: total,
          correct: ok,
          correctRate: total > 0 ? Math.round((ok / total) * 100) : null,
        },
      };
    });
  }

  async getOne(id: string) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { order: 'asc' } }, category: true },
    });
    if (!q) throw new NotFoundException('سؤال یافت نشد');
    return q;
  }

  // ---------- ساخت ----------
  async create(dto: CreateQuestionDto) {
    this.assertExactlyOneCorrect(dto.options);
    const categoryId = await this.resolveCategoryId(dto.categorySlug);

    return this.prisma.question.create({
      data: {
        text: dto.text,
        difficulty: dto.difficulty,
        isApproved: dto.isApproved ?? false,
        categoryId,
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        options: {
          create: dto.options.map((o, i) => ({
            text: o.text,
            isCorrect: o.isCorrect,
            order: i,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } }, category: true },
    });
  }

  // ---------- ویرایش ----------
  async update(id: string, dto: UpdateQuestionDto) {
    await this.getOne(id); // وجود را تأیید کن

    if (dto.options) this.assertExactlyOneCorrect(dto.options);
    const categoryId =
      dto.categorySlug !== undefined
        ? await this.resolveCategoryId(dto.categorySlug)
        : undefined;

    return this.prisma.$transaction(async (tx) => {
      // اگر گزینه‌های جدید آمد، قبلی‌ها را جایگزین کن
      if (dto.options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: dto.options.map((o, i) => ({
            questionId: id,
            text: o.text,
            isCorrect: o.isCorrect,
            order: i,
          })),
        });
      }

      return tx.question.update({
        where: { id },
        data: {
          ...(dto.text !== undefined ? { text: dto.text } : {}),
          ...(dto.difficulty !== undefined
            ? { difficulty: dto.difficulty }
            : {}),
          ...(dto.isApproved !== undefined
            ? { isApproved: dto.isApproved }
            : {}),
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(dto.metadata !== undefined
            ? { metadata: dto.metadata as Prisma.InputJsonValue }
            : {}),
        },
        include: { options: { orderBy: { order: 'asc' } }, category: true },
      });
    });
  }

  // ---------- تأیید/ردِ سریع ----------
  async setApproved(id: string, approved: boolean) {
    await this.getOne(id);
    return this.prisma.question.update({
      where: { id },
      data: { isApproved: approved },
      include: { options: { orderBy: { order: 'asc' } }, category: true },
    });
  }

  // ---------- حذف ----------
  async remove(id: string) {
    await this.getOne(id);
    await this.prisma.question.delete({ where: { id } });
    return { deleted: true };
  }

  // ---------- خلاصهٔ آمار ----------
  async overview() {
    const [total, approved, categories, answers] = await Promise.all([
      this.prisma.question.count(),
      this.prisma.question.count({ where: { isApproved: true } }),
      this.prisma.category.count(),
      this.prisma.answer.count(),
    ]);
    return {
      questions: { total, approved, pending: total - approved },
      categories,
      answers,
    };
  }

  // ---------- دسته‌بندی‌ها ----------
  listCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async createCategory(name: string, slug: string) {
    const exists = await this.prisma.category.findUnique({ where: { slug } });
    if (exists) throw new BadRequestException('این slug قبلاً وجود دارد');
    return this.prisma.category.create({ data: { name, slug } });
  }

  private assertExactlyOneCorrect(options: QuestionOptionDto[]): void {
    const correct = options.filter((o) => o.isCorrect).length;
    if (correct !== 1) {
      throw new BadRequestException('باید دقیقاً یک گزینهٔ درست باشد');
    }
  }

  private async resolveCategoryId(
    slug?: string,
  ): Promise<string | null | undefined> {
    if (slug === undefined) return undefined;
    if (slug === '' ) return null; // پاک‌کردنِ دسته
    const cat = await this.prisma.category.findUnique({ where: { slug } });
    if (!cat) throw new BadRequestException(`دستهٔ «${slug}» وجود ندارد`);
    return cat.id;
  }
}
