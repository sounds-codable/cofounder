import { WaitlistService } from './waitlist.service';
declare class SubscribeDto {
    email: string;
}
export declare class WaitlistController {
    private readonly waitlistService;
    constructor(waitlistService: WaitlistService);
    subscribe(dto: SubscribeDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
