import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError } from 'multer';
import {
  CreateAdminDto,
  UpdateAdminDto,
  UpdateAdminStatusDto,
  CreateUserDto,
  AdminQueryDto,
} from './superadmin.dto';
import { SuperAdminService } from './superadmin.service';

@Controller('superadmin')
export class SuperAdminController {
  constructor(private readonly superadminservice: SuperAdminService) {}

  @Post('admins')
  createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.superadminservice.createAdmin(createAdminDto);
  }

  @Get('admins')
  getAllAdmins(@Query() query: AdminQueryDto) {
    return this.superadminservice.getAllAdmins(query);
  }

  @Get('admins/:id')
  getAdminById(@Param('id') id: string) {
    return this.superadminservice.getAdminById(id);
  }

  @Put('admins/:id')
  updateAdmin(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.superadminservice.updateAdmin(id, updateAdminDto);
  }

  @Patch('admins/:id/status')
  updateAdminStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAdminStatusDto,
  ) {
    return this.superadminservice.updateAdminStatus(id, updateStatusDto);
  }

  @Delete('admins/:id')
  deleteAdmin(@Param('id') id: string) {
    return this.superadminservice.deleteAdmin(id);
  }

  @Post('admins/:id/nid-image')
  @UseInterceptors(
    FileInterceptor('nid', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|jpeg|png|webp)$/i)) {
          cb(null, true);
        } else {
          cb(new MulterError('LIMIT_UNEXPECTED_FILE', 'nid'), false);
        }
      },
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadNidImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.superadminservice.saveAdminNidImage(id, file);
  }

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.superadminservice.createUser(createUserDto);
  }

  @Get('users')
  getAllUsers(@Query() query: AdminQueryDto) {
    return this.superadminservice.getAllUsers(query);
  }
}
