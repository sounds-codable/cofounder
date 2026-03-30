import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerificationCode } from './entities/verification-code.entity';
import { User } from '../users/entities/user.entity';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private verificationCodeRepository;
    private userRepository;
    private jwtService;
    private configService;
    private mailService;
    constructor(verificationCodeRepository: Repository<VerificationCode>, userRepository: Repository<User>, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    private generateCode;
    sendVerificationCode(dto: SendCodeDto): Promise<{
        message: string;
    }>;
    verifyAndLogin(dto: VerifyCodeDto): Promise<{
        access_token: string;
        user: Partial<User>;
        isNewUser: boolean;
    }>;
    validateUser(userId: string): Promise<User>;
}
