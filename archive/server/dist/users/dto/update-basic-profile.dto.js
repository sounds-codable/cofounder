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
exports.UpdateDeveloperBasicProfileDto = exports.UpdateProjectOwnerBasicProfileDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateProjectOwnerBasicProfileDto {
    nickname;
    avatar;
    industry;
    industryExperience;
    bio;
}
exports.UpdateProjectOwnerBasicProfileDto = UpdateProjectOwnerBasicProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '昵称不能为空' }),
    (0, class_validator_1.MaxLength)(20, { message: '昵称最多20个字符' }),
    __metadata("design:type", String)
], UpdateProjectOwnerBasicProfileDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProjectOwnerBasicProfileDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择所在行业' }),
    __metadata("design:type", String)
], UpdateProjectOwnerBasicProfileDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写行业经验年限' }),
    __metadata("design:type", Number)
], UpdateProjectOwnerBasicProfileDto.prototype, "industryExperience", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '个人简介不能为空' }),
    (0, class_validator_1.MinLength)(50, { message: '个人简介至少50个字符' }),
    (0, class_validator_1.MaxLength)(200, { message: '个人简介最多200个字符' }),
    __metadata("design:type", String)
], UpdateProjectOwnerBasicProfileDto.prototype, "bio", void 0);
class UpdateDeveloperBasicProfileDto {
    nickname;
    avatar;
    techDirections;
    workYears;
    bio;
    projectExperience;
}
exports.UpdateDeveloperBasicProfileDto = UpdateDeveloperBasicProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '昵称不能为空' }),
    (0, class_validator_1.MaxLength)(20, { message: '昵称最多20个字符' }),
    __metadata("design:type", String)
], UpdateDeveloperBasicProfileDto.prototype, "nickname", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateDeveloperBasicProfileDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)({ message: '请选择技术方向' }),
    __metadata("design:type", Array)
], UpdateDeveloperBasicProfileDto.prototype, "techDirections", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsNotEmpty)({ message: '请填写工作年限' }),
    __metadata("design:type", Number)
], UpdateDeveloperBasicProfileDto.prototype, "workYears", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '个人简介不能为空' }),
    (0, class_validator_1.MinLength)(50, { message: '个人简介至少50个字符' }),
    (0, class_validator_1.MaxLength)(200, { message: '个人简介最多200个字符' }),
    __metadata("design:type", String)
], UpdateDeveloperBasicProfileDto.prototype, "bio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '项目经历不能为空' }),
    (0, class_validator_1.MinLength)(100, { message: '项目经历至少100个字符' }),
    (0, class_validator_1.MaxLength)(300, { message: '项目经历最多300个字符' }),
    __metadata("design:type", String)
], UpdateDeveloperBasicProfileDto.prototype, "projectExperience", void 0);
//# sourceMappingURL=update-basic-profile.dto.js.map