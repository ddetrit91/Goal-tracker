var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
// client/src/server/index.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import authRoutes from './auth';
import adminRoutes from './admin';
import { db } from '../db';
import { users } from '../db/schema';
// 1. ПРОВЕРКА СХЕМЫ И СОЗДАНИЕ АДМИНА
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var columnsToAdd, _i, columnsToAdd_1, col, e_1, adminEmail, adminPassword, existingAdmin, hash, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 14, , 15]);
                console.log('🔧 Checking database schema...');
                columnsToAdd = [
                    { name: 'start_date', sql: 'ALTER TABLE goals ADD COLUMN start_date TEXT' },
                    { name: 'status', sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'backlog'" },
                    { name: 'is_today_goal', sql: 'ALTER TABLE goals ADD COLUMN is_today_goal INTEGER DEFAULT 0' },
                    { name: 'role', sql: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'" },
                ];
                _i = 0, columnsToAdd_1 = columnsToAdd;
                _a.label = 1;
            case 1:
                if (!(_i < columnsToAdd_1.length)) return [3 /*break*/, 6];
                col = columnsToAdd_1[_i];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, db.run(col.sql)];
            case 3:
                _a.sent();
                console.log("\u2705 Added column: ".concat(col.name));
                return [3 /*break*/, 5];
            case 4:
                e_1 = _a.sent();
                if (e_1.message.includes('duplicate column') || e_1.message.includes('already exists')) {
                    console.log("\u2139\uFE0F Column already exists: ".concat(col.name));
                }
                else {
                    console.error("\u274C Failed to add column ".concat(col.name, ":"), e_1.message);
                }
                return [3 /*break*/, 5];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6:
                console.log('✅ Database schema is ready!');
                adminEmail = 'admin@goaltracker.local';
                adminPassword = 'AdminPass123!';
                return [4 /*yield*/, db.select().from(users).where(eq(users.email, adminEmail)).get()];
            case 7:
                existingAdmin = _a.sent();
                if (!!existingAdmin) return [3 /*break*/, 10];
                console.log('🔑 Creating default admin account...');
                return [4 /*yield*/, bcrypt.hash(adminPassword, 10)];
            case 8:
                hash = _a.sent();
                return [4 /*yield*/, db.insert(users).values({
                        id: crypto.randomUUID(),
                        email: adminEmail,
                        passwordHash: hash,
                        name: 'Administrator',
                        role: 'admin',
                    })];
            case 9:
                _a.sent();
                console.log('✅ Admin created successfully!');
                console.log("   Email: ".concat(adminEmail));
                console.log("   Password: ".concat(adminPassword));
                return [3 /*break*/, 13];
            case 10:
                if (!(existingAdmin.role !== 'admin')) return [3 /*break*/, 12];
                console.log('🔑 Upgrading existing user to admin...');
                return [4 /*yield*/, db.update(users).set({ role: 'admin' }).where(eq(users.id, existingAdmin.id))];
            case 11:
                _a.sent();
                console.log('✅ User upgraded to admin');
                return [3 /*break*/, 13];
            case 12:
                console.log('️ Admin account already exists and is active.');
                _a.label = 13;
            case 13: return [3 /*break*/, 15];
            case 14:
                err_1 = _a.sent();
                console.error('⚠️ Initialization failed:', err_1);
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); })();
// 3. НАСТРОЙКА СЕРВЕРА (ЕДИНСТВЕННЫЙ БЛОК)
var app = new Hono();
app.use('*', cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
}));
// Подключаем авторизацию к /api/auth
app.route('/api/auth', authRoutes);
// Подключаем ЦЕЛИ И ЗАДАЧИ к корню /api (чтобы фронтенд видел /api/goals)
app.route('/api', authRoutes);
// Подключаем админку
app.route('/api/admin', adminRoutes);
app.get('/api/health', function (c) { return c.json({ status: 'ok' }); });
var port = 3000;
console.log(" Server is running on http://localhost:".concat(port));
serve({ fetch: app.fetch, port: port });
