"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectOwnersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const project_owners_service_1 = require("./project-owners.service");
const project_owners_controller_1 = require("./project-owners.controller");
const user_entity_1 = require("../users/entities/user.entity");
const project_entity_1 = require("../projects/entities/project.entity");
let ProjectOwnersModule = class ProjectOwnersModule {
};
exports.ProjectOwnersModule = ProjectOwnersModule;
exports.ProjectOwnersModule = ProjectOwnersModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, project_entity_1.Project])],
        controllers: [project_owners_controller_1.ProjectOwnersController],
        providers: [project_owners_service_1.ProjectOwnersService],
        exports: [project_owners_service_1.ProjectOwnersService],
    })
], ProjectOwnersModule);
//# sourceMappingURL=project-owners.module.js.map