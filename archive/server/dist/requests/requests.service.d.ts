import { Repository } from 'typeorm';
import { Request, RequestStatus } from './entities/request.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { ApplyProjectDto, InviteDeveloperDto } from './dto/create-request.dto';
import { ProjectsService } from '../projects/projects.service';
export declare class RequestsService {
    private requestRepository;
    private projectRepository;
    private userRepository;
    private projectsService;
    constructor(requestRepository: Repository<Request>, projectRepository: Repository<Project>, userRepository: Repository<User>, projectsService: ProjectsService);
    applyProject(userId: string, dto: ApplyProjectDto): Promise<Request>;
    inviteDeveloper(userId: string, dto: InviteDeveloperDto): Promise<Request>;
    acceptRequest(userId: string, requestId: string): Promise<Request>;
    rejectRequest(userId: string, requestId: string): Promise<Request>;
    getReceivedRequests(userId: string, status?: RequestStatus): Promise<Request[]>;
    getSentRequests(userId: string, status?: RequestStatus): Promise<Request[]>;
    getContactInfo(userId: string, requestId: string): Promise<{
        realName: string;
        phone: string;
        wechat: string;
        city: string;
    } | null>;
}
