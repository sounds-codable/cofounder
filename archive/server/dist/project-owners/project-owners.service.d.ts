import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
export declare class ProjectOwnersService {
    private userRepository;
    private projectRepository;
    constructor(userRepository: Repository<User>, projectRepository: Repository<Project>);
    findOne(id: string): Promise<{
        profile: Partial<User>;
        projects: Partial<Project>[];
    }>;
}
