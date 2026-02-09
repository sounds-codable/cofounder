import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

// 项目方基础资料
export class UpdateProjectOwnerBasicProfileDto {
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  nickname: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsNotEmpty({ message: '请选择所在行业' })
  industry: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  industryExperience?: number;

  @IsString()
  @IsNotEmpty({ message: '个人简介不能为空' })
  @MinLength(50, { message: '个人简介至少50个字符' })
  @MaxLength(200, { message: '个人简介最多200个字符' })
  bio: string;
}

// 程序员基础资料
export class UpdateDeveloperBasicProfileDto {
  @IsString()
  @IsNotEmpty({ message: '昵称不能为空' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  nickname: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsNotEmpty({ message: '请选择技术方向' })
  techDirections: string[];

  @IsInt()
  @Min(0)
  @IsNotEmpty({ message: '请填写工作年限' })
  workYears: number;

  @IsString()
  @IsNotEmpty({ message: '个人简介不能为空' })
  @MinLength(50, { message: '个人简介至少50个字符' })
  @MaxLength(200, { message: '个人简介最多200个字符' })
  bio: string;

  @IsString()
  @IsNotEmpty({ message: '项目经历不能为空' })
  @MinLength(100, { message: '项目经历至少100个字符' })
  @MaxLength(300, { message: '项目经历最多300个字符' })
  projectExperience: string;
}

