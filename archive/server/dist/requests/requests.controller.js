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
exports.RequestsController = void 0;
const common_1 = require("@nestjs/common");
const requests_service_1 = require("./requests.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const create_request_dto_1 = require("./dto/create-request.dto");
const request_entity_1 = require("./entities/request.entity");
let RequestsController = class RequestsController {
    requestsService;
    constructor(requestsService) {
        this.requestsService = requestsService;
    }
    async applyProject(user, dto) {
        return this.requestsService.applyProject(user.id, dto);
    }
    async inviteDeveloper(user, dto) {
        return this.requestsService.inviteDeveloper(user.id, dto);
    }
    async acceptRequest(user, id) {
        return this.requestsService.acceptRequest(user.id, id);
    }
    async rejectRequest(user, id) {
        return this.requestsService.rejectRequest(user.id, id);
    }
    async getReceivedRequests(user, status) {
        return this.requestsService.getReceivedRequests(user.id, status);
    }
    async getSentRequests(user, status) {
        return this.requestsService.getSentRequests(user.id, status);
    }
    async getContactInfo(user, id) {
        return this.requestsService.getContactInfo(user.id, id);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, common_1.Post)('apply'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.DEVELOPER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, create_request_dto_1.ApplyProjectDto]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "applyProject", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.PROJECT_OWNER),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        create_request_dto_1.InviteDeveloperDto]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "inviteDeveloper", null);
__decorate([
    (0, common_1.Patch)(':id/accept'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Get)('received'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getReceivedRequests", null);
__decorate([
    (0, common_1.Get)('sent'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getSentRequests", null);
__decorate([
    (0, common_1.Get)(':id/contact'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getContactInfo", null);
exports.RequestsController = RequestsController = __decorate([
    (0, common_1.Controller)('requests'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [requests_service_1.RequestsService])
], RequestsController);
//# sourceMappingURL=requests.controller.js.map