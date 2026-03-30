import { CreateProjectDto } from './create-project.dto';
import { ProjectStatus } from '../entities/project.entity';
declare const UpdateProjectDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateProjectDto>>;
export declare class UpdateProjectDto extends UpdateProjectDto_base {
    status?: ProjectStatus;
}
export {};
