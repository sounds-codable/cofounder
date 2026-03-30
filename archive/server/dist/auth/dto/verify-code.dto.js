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
exports.VerifyCodeDto = void 0;
const class_validator_1 = require("class-validator");
const user_entity_1 = require("../../users/entities/user.entity");
class VerifyCodeDto {
    email;
    code;
    role;
}
exports.VerifyCodeDto = VerifyCodeDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: '请输入有效的邮箱地址' }),
    (0, class_validator_1.IsNotEmpty)({ message: '邮箱不能为空' }),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: '验证码不能为空' }),
    (0, class_validator_1.Length)(6, 6, { message: '验证码必须是6位数字' }),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(user_entity_1.UserRole, { message: '请选择有效的身份类型' }),
    (0, class_validator_1.IsNotEmpty)({ message: '身份类型不能为空' }),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "role", void 0);
//# sourceMappingURL=verify-code.dto.js.map