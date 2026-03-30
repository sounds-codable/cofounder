import { DevelopersService } from './developers.service';
export declare class DevelopersController {
    private readonly developersService;
    constructor(developersService: DevelopersService);
    findAll(techDirections?: string, interestedIndustries?: string, page?: string, limit?: string): Promise<{
        items: Partial<import("../users/entities/user.entity").User>[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<Partial<import("../users/entities/user.entity").User>>;
}
