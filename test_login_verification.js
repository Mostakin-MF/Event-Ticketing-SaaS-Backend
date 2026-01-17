const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { AuthService } = require('./dist/auth/auth.service');

async function verify_fix() {
    let app;
    try {
        app = await NestFactory.createApplicationContext(AppModule);
        const authService = app.get(AuthService);

        console.log('--- Verifying Login Fix ---');

        try {
            const result = await authService.signIn('staff1@example.com', 'Password@123');
            console.log('Login successful for staff1@example.com!');
            console.log('Role:', result.user.role);
            console.log('TenantId:', result.user.tenantId);
        } catch (e) {
            console.error('Login failed for staff1@example.com:', e.message);
        }

        try {
            const result2 = await authService.signIn('staff3@example.com', 'Password@123');
            console.log('Login successful for staff3@example.com!');
            console.log('Role:', result2.user.role);
            console.log('TenantId:', result2.user.tenantId);
        } catch (e) {
            console.error('Login failed for staff3@example.com:', e.message);
        }

    } catch (err) {
        console.error('Error during verification:', err.message);
    } finally {
        if (app) await app.close();
    }
}

verify_fix();
