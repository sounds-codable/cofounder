import { ProjectOwnersService } from './project-owners.service';
export declare class ProjectOwnersController {
    private readonly projectOwnersService;
    constructor(projectOwnersService: ProjectOwnersService);
    findOne(id: string): Promise<{
        profile: Partial<import("../users/entities/user.entity").User>;
        projects: Partial<import("../projects/entities/project.entity").Project>[];
    }>;
}
