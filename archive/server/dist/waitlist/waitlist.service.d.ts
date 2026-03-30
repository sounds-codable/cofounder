import { ConfigService } from '@nestjs/config';
export declare class WaitlistService {
    private configService;
    private readonly logger;
    private listValidated;
    private readonly queueSuccessMessage;
    constructor(configService: ConfigService);
    private isDoubleOptinEnabled;
    private sendOptinEmail;
    private findSubscriberIdByEmail;
    private addSubscriberToList;
    subscribe(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
