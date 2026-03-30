import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProjectOwnerBasicProfileDto, UpdateDeveloperBasicProfileDto } from './dto/update-basic-profile.dto';
import { UpdateProjectOwnerDetailProfileDto, UpdateDeveloperDetailProfileDto } from './dto/update-detail-profile.dto';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findById(id: string): Promise<User>;
    getProfile(userId: string): Promise<User>;
    updateProjectOwnerBasicProfile(userId: string, dto: UpdateProjectOwnerBasicProfileDto): Promise<User>;
    updateDeveloperBasicProfile(userId: string, dto: UpdateDeveloperBasicProfileDto): Promise<User>;
    updateProjectOwnerDetailProfile(userId: string, dto: UpdateProjectOwnerDetailProfileDto): Promise<User>;
    updateDeveloperDetailProfile(userId: string, dto: UpdateDeveloperDetailProfileDto): Promise<User>;
    getPublicProfile(user: User): Partial<User>;
    getDetailedProfile(user: User, hideContact?: boolean): Partial<User>;
}
