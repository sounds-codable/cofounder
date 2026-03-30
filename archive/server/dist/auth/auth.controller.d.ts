import { AuthService } from './auth.service';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    sendCode(dto: SendCodeDto): Promise<{
        message: string;
    }>;
    verify(dto: VerifyCodeDto): Promise<{
        access_token: string;
        user: Partial<import("../users/entities/user.entity").User>;
        isNewUser: boolean;
    }>;
}
