import { ProjectsService } from './projects.service';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus } from './entities/project.entity';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
    create(user: User, dto: CreateProjectDto): Promise<import("./entities/project.entity").Project>;
    findAll(industry?: string, techNeeds?: string, status?: ProjectStatus, page?: string, limit?: string): Promise<{
        items: import("./entities/project.entity").Project[];
        total: number;
        page: number;
        limit: number;
    }>;
    findMyProjects(user: User): Promise<import("./entities/project.entity").Project[]>;
    findOne(id: string): Promise<import("./entities/project.entity").Project>;
    update(user: User, id: string, dto: UpdateProjectDto): Promise<import("./entities/project.entity").Project>;
    close(user: User, id: string): Promise<import("./entities/project.entity").Project>;
}
