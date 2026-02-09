import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(50, { message: '项目名称最多50个字符' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '请选择所属行业' })
  industry: string;

  @IsString()
  @IsNotEmpty({ message: '项目介绍不能为空' })
  @MinLength(50, { message: '项目介绍至少50个字符' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: '目标用户不能为空' })
  targetUsers: string;

  @IsString()
  @IsNotEmpty({ message: '请填写为什么这个项目能成' })
  @MinLength(50, { message: '至少50个字符' })
  whySucceed: string;

  @IsArray()
  @IsNotEmpty({ message: '请选择需要的技术能力' })
  techNeeds: string[];

  @IsString()
  @IsOptional()
  techNotes?: string;

  @IsString()
  @IsNotEmpty({ message: 'MVP计划不能为空' })
  mvpPlan: string;

  @IsString()
  @IsOptional()
  cooperationNotes?: string;
}

