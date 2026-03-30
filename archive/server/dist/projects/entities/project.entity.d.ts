import { User } from '../../users/entities/user.entity';
export declare enum ProjectStatus {
    OPEN = "open",
    MATCHED = "matched",
    CLOSED = "closed"
}
export declare class Project {
    id: string;
    ownerId: string;
    owner: User;
    title: string;
    industry: string;
    description: string;
    targetUsers: string;
    whySucceed: string;
    techNeeds: string[];
    techNotes: string;
    mvpPlan: string;
    cooperationNotes: string;
    status: ProjectStatus;
    applicationCount: number;
    createdAt: Date;
    updatedAt: Date;
}
