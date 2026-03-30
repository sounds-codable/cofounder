import { RequestsService } from './requests.service';
import { User } from '../users/entities/user.entity';
import { ApplyProjectDto, InviteDeveloperDto } from './dto/create-request.dto';
import { RequestStatus } from './entities/request.entity';
export declare class RequestsController {
    private readonly requestsService;
    constructor(requestsService: RequestsService);
    applyProject(user: User, dto: ApplyProjectDto): Promise<import("./entities/request.entity").Request>;
    inviteDeveloper(user: User, dto: InviteDeveloperDto): Promise<import("./entities/request.entity").Request>;
    acceptRequest(user: User, id: string): Promise<import("./entities/request.entity").Request>;
    rejectRequest(user: User, id: string): Promise<import("./entities/request.entity").Request>;
    getReceivedRequests(user: User, status?: RequestStatus): Promise<import("./entities/request.entity").Request[]>;
    getSentRequests(user: User, status?: RequestStatus): Promise<import("./entities/request.entity").Request[]>;
    getContactInfo(user: User, id: string): Promise<{
        realName: string;
        phone: string;
        wechat: string;
        city: string;
    } | null>;
}
