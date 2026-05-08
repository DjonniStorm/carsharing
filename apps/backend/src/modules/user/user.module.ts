import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { IUserRepositoryToken } from './repositories/user.repository.interface';
import { UserController } from './controllers/user.controller';

@Module({
  providers: [
    UserService,
    { provide: IUserRepositoryToken, useClass: UserRepository },
  ],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
