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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectOwnersController = void 0;
const common_1 = require("@nestjs/common");
const project_owners_service_1 = require("./project-owners.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const public_decorator_1 = require("../common/decorators/public.decorator");
let ProjectOwnersController = class ProjectOwnersController {
    projectOwnersService;
    constructor(projectOwnersService) {
        this.projectOwnersService = projectOwnersService;
    }
    async findOne(id) {
        return this.projectOwnersService.findOne(id);
    }
};
exports.ProjectOwnersController = ProjectOwnersController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProjectOwnersController.prototype, "findOne", null);
exports.ProjectOwnersController = ProjectOwnersController = __decorate([
    (0, common_1.Controller)('project-owners'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [project_owners_service_1.ProjectOwnersService])
], ProjectOwnersController);
//# sourceMappingURL=project-owners.controller.js.map