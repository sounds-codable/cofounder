import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private projectRepository;
    private userRepository;
    constructor(projectRepository: Repository<Project>, userRepository: Repository<User>);
    create(userId: string, dto: CreateProjectDto): Promise<Project>;
    findAll(query: {
        industry?: string;
        techNeeds?: string;
        status?: ProjectStatus;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Project[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Project>;
    update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<Project>;
    close(userId: string, projectId: string): Promise<Project>;
    findMyProjects(userId: string): Promise<Project[]>;
    incrementApplicationCount(projectId: string): Promise<void>;
}
