import { UserRole } from '../../users/entities/user.entity';
export declare class VerifyCodeDto {
    email: string;
    code: string;
    role: UserRole;
}
