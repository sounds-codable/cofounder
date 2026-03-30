"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3010;
    await app.listen(port);
    console.log(`🚀 叩饭（Cofounder）后端服务已启动: http://localhost:${port}`);
    console.log(`📚 API 地址: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map