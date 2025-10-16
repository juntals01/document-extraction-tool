import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { promises as fsp } from 'fs';
import { diskStorage } from 'multer';
import * as path from 'path';
import { ReportService } from '../processing/services/report.service';
import { QueueService } from '../queue/queue.service';
import { PaginatedUploadResponseDto } from './dto/paginated-upload-response.dto';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadService } from './upload.service';
import { ensureDir } from './utils/ensure-dir';
import { slugify } from './utils/slugify';

type UploadedPdf = {
  originalName: string;
  storedName: string;
  slug: string;
  size: number;
  mimetype: string;
  path: string;
};

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly queueService: QueueService,
    private readonly reportService: ReportService,
  ) {}

  // --- NEW: GET /upload (list) ---
  @Get()
  @ApiOkResponse({ type: PaginatedUploadResponseDto })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(@Query('page') pageQ?: string, @Query('limit') limitQ?: string) {
    const page = Math.max(1, Number(pageQ || 1));
    const limit = Math.min(100, Math.max(1, Number(limitQ || 20)));
    const { items, total } = await this.uploadService.listUploads(page, limit);
    return { items, page, limit, total };
  }

  // --- NEW: POST /upload/:id/queue (enqueue) ---
  @Post(':id/queue')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        status: { type: 'string', example: 'pending' },
      },
    },
  })
  async enqueueById(@Param('id') id: string) {
    await this.uploadService.assertUploadExists(id);
    const job = await this.queueService.enqueue('extract_pdf', {
      uploadId: id,
    });
    return { jobId: job.id, status: job.status };
  }

  /** Accepts multiple PDF files, saves to disk with unique slug, and records them in the database. */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
      required: ['files'],
    },
  })
  @ApiOkResponse({ type: [UploadResponseDto] })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir =
            process.env.UPLOAD_DIR?.trim() ||
            path.join(process.cwd(), 'uploads');
          fsp
            .mkdir(dir, { recursive: true })
            .then(() => cb(null, dir))
            .catch((e) => cb(e as any, dir));
        },
        filename: (req, file, cb) => {
          const temp = `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
          cb(null, temp);
        },
      }),
      fileFilter: (req, file, cb) => {
        const isPdf =
          file.mimetype === 'application/pdf' ||
          file.originalname.toLowerCase().endsWith('.pdf');
        if (!isPdf)
          return cb(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        cb(null, true);
      },
      limits: { fileSize: 1024 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length)
      throw new BadRequestException('No files received. Use "files" field.');

    const records: UploadedPdf[] = [];
    const uploadDir = this.uploadService.getUploadDir();
    await ensureDir(uploadDir);

    // 1️⃣ Save files to disk
    for (const file of files) {
      const baseName = path.parse(file.originalname).name;
      const baseSlug = slugify(baseName) || 'document';
      const unique = await this.uploadService.uniqueSlug(baseSlug, '.pdf');
      const finalName = `${unique}.pdf`;
      const finalPath = path.join(uploadDir, finalName);
      await ensureDir(path.dirname(finalPath));
      await fsp.rename(file.path, finalPath);

      records.push({
        originalName: file.originalname,
        storedName: finalName,
        slug: unique,
        size: file.size,
        mimetype: file.mimetype,
        path: finalPath,
      });
    }

    // 2️⃣ Save records in DB
    const saved = await this.uploadService.createMany(
      records.map((r) => ({
        originalName: r.originalName,
        storedName: r.storedName,
        slug: r.slug,
        path: r.path,
        size: r.size,
        mimetype: r.mimetype,
      })),
    );

    // 3️⃣ Enqueue extraction for each saved upload
    for (const row of saved) {
      await this.queueService.enqueue('extract_pdf', {
        uploadId: row.id,
        slug: row.slug,
        filename: row.storedName,
      });
    }

    return saved;
  }

  @Get(':id/report')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalGoals: { type: 'number' },
            totalBMPs: { type: 'number' },
            completionRate: { type: 'number' },
          },
          required: ['totalGoals', 'totalBMPs', 'completionRate'],
        },
        goals: { type: 'array', items: { type: 'object' } },
        bmps: { type: 'array', items: { type: 'object' } },
        implementation: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'array', items: { type: 'object' } },
        outreach: { type: 'array', items: { type: 'object' } },
        geographicAreas: { type: 'array', items: { type: 'object' } },
      },
      required: [
        'summary',
        'goals',
        'bmps',
        'implementation',
        'monitoring',
        'outreach',
        'geographicAreas',
      ],
    },
  })
  async getReport(@Param('id') id: string) {
    await this.uploadService.assertUploadExists(id);
    return this.reportService.getExtractedReportByUploadId(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: UploadResponseDto })
  async getOne(@Param('id') id: string) {
    const row = await this.uploadService.getById(id);
    return row; // shaped like UploadResponseDto
  }
}
