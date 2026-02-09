import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  MaxLength,
  MinLength,
  IsMobilePhone,
} from 'class-validator';

// 项目方详细资料
export class UpdateProjectOwnerDetailProfileDto {
  @IsString()
  @IsNotEmpty({ message: '真实姓名不能为空' })
  realName: string;

  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: '微信号不能为空' })
  wechat: string;

  @IsString()
  @IsNotEmpty({ message: '所在城市不能为空' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: '请选择最高学历' })
  education: string;

  @IsString()
  @IsOptional()
  school?: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsString()
  @IsNotEmpty({ message: '请填写工作单位' })
  company: string;

  @IsString()
  @IsNotEmpty({ message: '请填写职位' })
  position: string;

  @IsString()
  @IsNotEmpty({ message: '请选择在职状态' })
  employmentStatus: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '工作经历描述最多500个字符' })
  workExperienceDesc?: string;

  @IsString()
  @IsNotEmpty({ message: '行业资源描述不能为空' })
  @MinLength(100, { message: '行业资源描述至少100个字符' })
  @MaxLength(300, { message: '行业资源描述最多300个字符' })
  industryResources: string;

  @IsString()
  @IsOptional()
  @MaxLength(300, { message: '相关行业经历最多300个字符' })
  relatedExperience?: string;

  @IsArray()
  @IsNotEmpty({ message: '请选择能提供的资源' })
  canProvide: string[];
}

// 程序员详细资料
export class UpdateDeveloperDetailProfileDto {
  @IsString()
  @IsNotEmpty({ message: '真实姓名不能为空' })
  realName: string;

  @IsString()
  @IsNotEmpty({ message: '手机号不能为空' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: '微信号不能为空' })
  wechat: string;

  @IsString()
  @IsNotEmpty({ message: '所在城市不能为空' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: '请选择最高学历' })
  education: string;

  @IsString()
  @IsOptional()
  school?: string;

  @IsString()
  @IsOptional()
  major?: string;

  @IsString()
  @IsNotEmpty({ message: '请填写工作单位' })
  company: string;

  @IsString()
  @IsNotEmpty({ message: '请填写职位' })
  position: string;

  @IsString()
  @IsNotEmpty({ message: '请选择在职状态' })
  employmentStatus: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '工作经历描述最多500个字符' })
  workExperienceDesc?: string;

  @IsString()
  @IsNotEmpty({ message: '请填写技术栈' })
  techStack: string;

  @IsString()
  @IsOptional()
  github?: string;

  @IsString()
  @IsNotEmpty({ message: '请填写详细项目经历' })
  detailedProjects: string;

  @IsArray()
  @IsNotEmpty({ message: '请选择感兴趣的行业方向' })
  interestedIndustries: string[];

  @IsString()
  @IsNotEmpty({ message: '请选择每周可投入时间' })
  weeklyHours: string;
}

