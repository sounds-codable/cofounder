export declare enum UserRole {
    PROJECT_OWNER = "project_owner",
    DEVELOPER = "developer"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    nickname: string;
    avatar: string;
    industry: string;
    industryExperience: number;
    techDirections: string[];
    workYears: number;
    bio: string;
    projectExperience: string;
    basicProfileCompleted: boolean;
    realName: string;
    phone: string;
    wechat: string;
    city: string;
    education: string;
    school: string;
    major: string;
    company: string;
    position: string;
    employmentStatus: string;
    workExperienceDesc: string;
    industryResources: string;
    relatedExperience: string;
    canProvide: string[];
    techStack: string;
    github: string;
    detailedProjects: string;
    interestedIndustries: string[];
    weeklyHours: string;
    detailProfileCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
}
