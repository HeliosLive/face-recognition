import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';

const storageOptions = diskStorage({
  destinaton: './uploads',
  filename: (req, file, callback) => {
    callback(null, `${Date.now()}.${extname(file.originalname)}`);
  },
});

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 50, { storage: storageOptions }))
  async uploadFile(@UploadedFiles() files): Promise<any> {
    return this.uploadService.upload(files);
  }
}
