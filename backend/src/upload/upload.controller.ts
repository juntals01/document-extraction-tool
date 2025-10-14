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

    return saved;
  }
}
