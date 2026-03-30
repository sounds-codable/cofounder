import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
export declare class DevelopersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findAll(query: {
        techDirections?: string;
        interestedIndustries?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: Partial<User>[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Partial<User>>;
    getContactInfo(developerId: string, requesterId: string, requesterDetailCompleted: boolean): Promise<Partial<User> | null>;
}
