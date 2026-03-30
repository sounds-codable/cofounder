import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

// 程序员申请项目
export class ApplyProjectDto {
  @IsUUID()
  @IsNotEmpty({ message: '项目ID不能为空' })
  projectId: string;

  @IsString()
  @IsOptional()
  message?: string; // 留言
}

// 项目方邀请程序员
export class InviteDeveloperDto {
  @IsUUID()
  @IsNotEmpty({ message: '程序员ID不能为空' })
  developerId: string;

  @IsUUID()
  @IsNotEmpty({ message: '项目ID不能为空' })
  projectId: string;

  @IsString()
  @IsOptional()
  message?: string; // 留言
}

