import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReadUserEntity } from '../entities/dtos/user.read';
import {
  EmailAlreadyExistsException,
  PhoneAlreadyExistsException,
  UserAlreadyExistsException,
  UserNotFoundException,
} from '../common/errors';
import { CreateUserEntity } from '../entities/dtos/user.create';
import { UpdateUserEntity } from '../entities/dtos/user.update';

@Controller('users')
@ApiTags('Users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Получить всех пользователей' })
  @ApiResponse({ status: 200, type: [ReadUserEntity] })
  async findAll(
    @Query('includeDeleted') includeDeleted: boolean = false,
  ): Promise<ReadUserEntity[]> {
    this.logger.debug('findAll', { includeDeleted });
    try {
      return this.userService.findAll(includeDeleted);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async findById(@Param('id') id: string): Promise<ReadUserEntity | null> {
    this.logger.debug('findById', { id });
    try {
      return this.userService.findById(id);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Получить пользователя по email' })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async findByEmail(
    @Param('email') email: string,
  ): Promise<ReadUserEntity | null> {
    this.logger.debug('findByEmail', { email });
    try {
      return this.userService.findByEmail(email);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'Получить пользователя по телефону' })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async findByPhone(
    @Param('phone') phone: string,
  ): Promise<ReadUserEntity | null> {
    this.logger.debug('findByPhone', { phone });
    try {
      return this.userService.findByPhone(phone);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать пользователя' })
  @ApiResponse({ status: 201, type: ReadUserEntity })
  async create(@Body() user: CreateUserEntity): Promise<ReadUserEntity> {
    this.logger.debug('create user');
    try {
      return this.userService.create(user);
    } catch (error) {
      if (error instanceof UserAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof EmailAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof PhoneAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить пользователя' })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async update(
    @Param('id') id: string,
    @Body() user: UpdateUserEntity,
  ): Promise<ReadUserEntity> {
    this.logger.debug('update user', { id });
    try {
      return this.userService.update(id, user);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof EmailAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof PhoneAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async delete(@Param('id') id: string): Promise<ReadUserEntity> {
    this.logger.debug('delete', { id });
    try {
      return this.userService.delete(id);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('restore/:id')
  @ApiOperation({ summary: 'Восстановить пользователя' })
  @ApiResponse({ status: 200, type: ReadUserEntity })
  async restore(@Param('id') id: string): Promise<ReadUserEntity> {
    this.logger.debug('restore', { id });
    try {
      return this.userService.restore(id);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
