import { IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from '../entities/request.entity';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus, { message: '无效的状态' })
  @IsNotEmpty({ message: '状态不能为空' })
  status: RequestStatus;
}

