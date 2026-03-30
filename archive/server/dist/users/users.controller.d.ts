import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateProjectOwnerBasicProfileDto, UpdateDeveloperBasicProfileDto } from './dto/update-basic-profile.dto';
import { UpdateProjectOwnerDetailProfileDto, UpdateDeveloperDetailProfileDto } from './dto/update-detail-profile.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: User): Promise<User>;
    updateProjectOwnerBasicProfile(user: User, dto: UpdateProjectOwnerBasicProfileDto): Promise<User>;
    updateDeveloperBasicProfile(user: User, dto: UpdateDeveloperBasicProfileDto): Promise<User>;
    updateProjectOwnerDetailProfile(user: User, dto: UpdateProjectOwnerDetailProfileDto): Promise<User>;
    updateDeveloperDetailProfile(user: User, dto: UpdateDeveloperDetailProfileDto): Promise<User>;
}
