"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDeveloperDetailProfileDto = exports.UpdateProjectOwnerDetailProfileDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateProjectOwnerDetailProfileDto {
    realName;
    phone;
    wechat;
    city;
    education;
    school;
    major;
    company;
    position;
    employmentStatus;
    workExperienceDesc;
    industryResources;
    relatedExperience;
    canProvide;
}
exports.UpdateProjectOwnerDetailProfileDto = UpdateProjectOwnerDetailProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '真实姓名不能为空' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "realName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '手机号不能为空' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '微信号不能为空' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "wechat", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '所在城市不能为空' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择最高学历' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "education", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "school", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "major", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写工作单位' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写职位' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择在职状态' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "employmentStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500, { message: '工作经历描述最多500个字符' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "workExperienceDesc", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '行业资源描述不能为空' }),
    (0, class_validator_1.MinLength)(100, { message: '行业资源描述至少100个字符' }),
    (0, class_validator_1.MaxLength)(300, { message: '行业资源描述最多300个字符' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "industryResources", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(300, { message: '相关行业经历最多300个字符' }),
    __metadata("design:type", String)
], UpdateProjectOwnerDetailProfileDto.prototype, "relatedExperience", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择能提供的资源' }),
    __metadata("design:type", Array)
], UpdateProjectOwnerDetailProfileDto.prototype, "canProvide", void 0);
class UpdateDeveloperDetailProfileDto {
    realName;
    phone;
    wechat;
    city;
    education;
    school;
    major;
    company;
    position;
    employmentStatus;
    workExperienceDesc;
    techStack;
    github;
    detailedProjects;
    interestedIndustries;
    weeklyHours;
}
exports.UpdateDeveloperDetailProfileDto = UpdateDeveloperDetailProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '真实姓名不能为空' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "realName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '手机号不能为空' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '微信号不能为空' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "wechat", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '所在城市不能为空' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择最高学历' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "education", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "school", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "major", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写工作单位' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "company", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写职位' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择在职状态' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "employmentStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(500, { message: '工作经历描述最多500个字符' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "workExperienceDesc", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写技术栈' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "techStack", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "github", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写详细项目经历' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "detailedProjects", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择感兴趣的行业方向' }),
    __metadata("design:type", Array)
], UpdateDeveloperDetailProfileDto.prototype, "interestedIndustries", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择每周可投入时间' }),
    __metadata("design:type", String)
], UpdateDeveloperDetailProfileDto.prototype, "weeklyHours", void 0);
//# sourceMappingURL=update-detail-profile.dto.js.map