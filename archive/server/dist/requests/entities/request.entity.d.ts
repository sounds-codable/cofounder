import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
export declare enum RequestType {
    DEVELOPER_APPLY = "developer_apply",
    OWNER_INVITE = "owner_invite"
}
export declare enum RequestStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export declare class Request {
    id: string;
    type: RequestType;
    senderId: string;
    sender: User;
    receiverId: string;
    receiver: User;
    projectId: string;
    project: Project;
    message: string;
    status: RequestStatus;
    createdAt: Date;
    updatedAt: Date;
}
