var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
// client/src/server/admin.ts
import { Hono } from 'hono';
import { db } from '../db';
import { users, goals as goalsTable, activityLogs, settings as settingsTable } from '../db/schema';
import { eq, count, sql, and, isNull } from 'drizzle-orm'; // <-- ДОБАВЛЕН desc
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
var admin = new Hono();
// Middleware: Проверка, что пользователь — админ
admin.use('*', function (c, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                return [4 /*yield*/, db.select().from(users).where(eq(users.id, userId)).get()];
            case 1:
                user = _a.sent();
                if (!user || user.role !== 'admin') {
                    return [2 /*return*/, c.json({ error: 'Forbidden: Admin access required' }, 403)];
                }
                return [4 /*yield*/, next()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// GET /admin/users - Получить всех пользователей с корректным подсчетом целей
admin.get('/users', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userList, usersWithGoals, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, db.select().from(users)];
            case 1:
                userList = _a.sent();
                return [4 /*yield*/, Promise.all(userList.map(function (user) { return __awaiter(void 0, void 0, void 0, function () {
                        var mainGoals;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, db
                                        .select({ count: count() })
                                        .from(goalsTable)
                                        .where(and(eq(goalsTable.userId, user.id), isNull(goalsTable.parentId)))];
                                case 1:
                                    mainGoals = _b.sent();
                                    return [2 /*return*/, __assign(__assign({}, user), { goalCount: ((_a = mainGoals[0]) === null || _a === void 0 ? void 0 : _a.count) || 0 })];
                            }
                        });
                    }); }))];
            case 2:
                usersWithGoals = _a.sent();
                return [2 /*return*/, c.json(usersWithGoals)];
            case 3:
                error_1 = _a.sent();
                console.error('Fetch users error:', error_1);
                return [2 /*return*/, c.json({ error: 'Failed to fetch users' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
// POST /admin/users - Создать нового пользователя
admin.post('/users', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, name_1, role, existingUser, passwordHash, id, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                _a = _b.sent(), email = _a.email, password = _a.password, name_1 = _a.name, role = _a.role;
                if (!email || !password) {
                    return [2 /*return*/, c.json({ error: 'Email и пароль обязательны' }, 400)];
                }
                return [4 /*yield*/, db.select().from(users).where(eq(users.email, email)).get()];
            case 2:
                existingUser = _b.sent();
                if (existingUser) {
                    return [2 /*return*/, c.json({ error: 'Пользователь с таким email уже существует' }, 409)];
                }
                return [4 /*yield*/, bcrypt.hash(password, 10)];
            case 3:
                passwordHash = _b.sent();
                id = randomUUID();
                return [4 /*yield*/, db.insert(users).values({
                        id: id,
                        email: email,
                        passwordHash: passwordHash,
                        name: name_1 || null,
                        role: role || 'user',
                    })];
            case 4:
                _b.sent();
                return [2 /*return*/, c.json({ message: 'Пользователь создан', user: { id: id, email: email, name: name_1, role: role } }, 201)];
            case 5:
                error_2 = _b.sent();
                console.error('Create user error:', error_2);
                return [2 /*return*/, c.json({ error: 'Failed to create user' }, 500)];
            case 6: return [2 /*return*/];
        }
    });
}); });
// PUT /admin/users/:id/role - Изменить роль пользователя
admin.put('/users/:id/role', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var id, role, admins, error_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                id = c.req.param('id');
                return [4 /*yield*/, c.req.json()];
            case 1:
                role = (_b.sent()).role;
                if (!(role !== 'admin')) return [3 /*break*/, 3];
                return [4 /*yield*/, db.select({ count: count() }).from(users).where(eq(users.role, 'admin'))];
            case 2:
                admins = _b.sent();
                if (((_a = admins[0]) === null || _a === void 0 ? void 0 : _a.count) <= 1) {
                    return [2 /*return*/, c.json({ error: 'Cannot remove the last admin' }, 400)];
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, db.update(users).set({ role: role }).where(eq(users.id, id))];
            case 4:
                _b.sent();
                return [2 /*return*/, c.json({ message: 'Role updated successfully' })];
            case 5:
                error_3 = _b.sent();
                console.error('Update role error:', error_3);
                return [2 /*return*/, c.json({ error: 'Failed to update role' }, 500)];
            case 6: return [2 /*return*/];
        }
    });
}); });
// POST /admin/users/:id/reset-password - Сбросить пароль (админ устанавливает новый)
admin.post('/users/:id/reset-password', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var id, newPassword, hash, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = c.req.param('id');
                return [4 /*yield*/, c.req.json()];
            case 1:
                newPassword = (_a.sent()).newPassword;
                if (!newPassword || newPassword.length < 6) {
                    return [2 /*return*/, c.json({ error: 'Пароль должен быть не менее 6 символов' }, 400)];
                }
                return [4 /*yield*/, bcrypt.hash(newPassword, 10)];
            case 2:
                hash = _a.sent();
                return [4 /*yield*/, db.update(users).set({ passwordHash: hash }).where(eq(users.id, id))];
            case 3:
                _a.sent();
                return [2 /*return*/, c.json({ message: 'Password updated successfully' })];
            case 4:
                error_4 = _a.sent();
                console.error('Reset password error:', error_4);
                return [2 /*return*/, c.json({ error: 'Failed to reset password' }, 500)];
            case 5: return [2 /*return*/];
        }
    });
}); });
// DELETE /admin/users/:id - Удалить пользователя
admin.delete('/users/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var id, currentUserId, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = c.req.param('id');
                currentUserId = c.req.header('X-User-Id');
                if (id === currentUserId) {
                    return [2 /*return*/, c.json({ error: 'Cannot delete yourself' }, 400)];
                }
                return [4 /*yield*/, db.delete(users).where(eq(users.id, id))];
            case 1:
                _a.sent();
                return [2 /*return*/, c.json({ message: 'User deleted successfully' })];
            case 2:
                error_5 = _a.sent();
                console.error('Delete user error:', error_5);
                return [2 /*return*/, c.json({ error: 'Failed to delete user' }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /admin/stats - Получить статистику системы
admin.get('/stats', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var today, totalUsersResult, totalUsers, activeTodayResult, activeToday, requestsTodayResult, requestsToday, registrationsByDay, requestsByDay, error_6;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 6, , 7]);
                today = new Date().toISOString().split('T')[0];
                return [4 /*yield*/, db.select({ count: count() }).from(users)];
            case 1:
                totalUsersResult = _d.sent();
                totalUsers = ((_a = totalUsersResult[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
                return [4 /*yield*/, db
                        .select({ count: count() })
                        .from(users)
                        .where(sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["date(last_login) = date(", ")"], ["date(last_login) = date(", ")"])), today))];
            case 2:
                activeTodayResult = _d.sent();
                activeToday = ((_b = activeTodayResult[0]) === null || _b === void 0 ? void 0 : _b.count) || 0;
                return [4 /*yield*/, db
                        .select({ count: count() })
                        .from(activityLogs)
                        .where(sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["date(created_at) = date(", ")"], ["date(created_at) = date(", ")"])), today))];
            case 3:
                requestsTodayResult = _d.sent();
                requestsToday = ((_c = requestsTodayResult[0]) === null || _c === void 0 ? void 0 : _c.count) || 0;
                return [4 /*yield*/, db
                        .select({
                        date: sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["date(created_at)"], ["date(created_at)"]))).as('date'),
                        count: count(),
                    })
                        .from(users)
                        .groupBy(sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["date(created_at)"], ["date(created_at)"]))))
                        .orderBy(sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["date(created_at) DESC"], ["date(created_at) DESC"]))))
                        .limit(7)];
            case 4:
                registrationsByDay = _d.sent();
                return [4 /*yield*/, db
                        .select({
                        date: sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["date(created_at)"], ["date(created_at)"]))).as('date'),
                        count: count(),
                    })
                        .from(activityLogs)
                        .groupBy(sql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["date(created_at)"], ["date(created_at)"]))))
                        .orderBy(sql(templateObject_8 || (templateObject_8 = __makeTemplateObject(["date(created_at) DESC"], ["date(created_at) DESC"]))))
                        .limit(7)];
            case 5:
                requestsByDay = _d.sent();
                return [2 /*return*/, c.json({
                        totalUsers: totalUsers,
                        activeToday: activeToday,
                        requestsToday: requestsToday,
                        registrationsByDay: registrationsByDay,
                        requestsByDay: requestsByDay,
                    })];
            case 6:
                error_6 = _d.sent();
                console.error('Fetch stats error:', error_6);
                return [2 /*return*/, c.json({ error: 'Failed to fetch stats' }, 500)];
            case 7: return [2 /*return*/];
        }
    });
}); });
// client/src/server/admin.ts (найди и замени GET /admin/activity)
// GET /admin/activity - Журнал входов (последний вход + кол-во запросов)
admin.get('/activity', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var logs, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db.select({
                        userId: activityLogs.userId,
                        userName: users.name,
                        userEmail: users.email,
                        userRole: users.role,
                        lastLogin: sql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["MAX(", ")"], ["MAX(", ")"])), activityLogs.createdAt).as('last_login'), // <-- Последняя активность
                        requestCount: sql(templateObject_10 || (templateObject_10 = __makeTemplateObject(["COUNT(*)"], ["COUNT(*)"]))).as('request_count'), // <-- Количество входов
                    })
                        .from(activityLogs)
                        .leftJoin(users, eq(activityLogs.userId, users.id))
                        .groupBy(activityLogs.userId, users.name, users.email, users.role) // Группируем по юзеру
                        .orderBy(sql(templateObject_11 || (templateObject_11 = __makeTemplateObject(["MAX(", ") DESC"], ["MAX(", ") DESC"])), activityLogs.createdAt)) // Сортируем по последнему входу
                        .limit(50)];
            case 1:
                logs = _a.sent();
                return [2 /*return*/, c.json(logs)];
            case 2:
                error_7 = _a.sent();
                console.error('Fetch activity error:', error_7);
                return [2 /*return*/, c.json({ error: 'Failed to fetch activity' }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /admin/settings - Получить настройки
admin.get('/settings', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var allSettings, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, db.select().from(settingsTable)];
            case 1:
                allSettings = _a.sent();
                return [2 /*return*/, c.json(allSettings)];
            case 2:
                error_8 = _a.sent();
                console.error('Fetch settings error:', error_8);
                return [2 /*return*/, c.json({ error: 'Failed to fetch settings' }, 500)];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /admin/settings - Обновить настройку
admin.put('/settings', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, key, value, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, c.req.json()];
            case 1:
                _a = _b.sent(), key = _a.key, value = _a.value;
                return [4 /*yield*/, db.insert(settingsTable).values({ key: key, value: value })
                        .onConflictDoUpdate({ target: settingsTable.key, set: { value: value, updatedAt: new Date().toISOString() } })];
            case 2:
                _b.sent();
                return [2 /*return*/, c.json({ message: 'Setting updated successfully' })];
            case 3:
                error_9 = _b.sent();
                console.error('Update setting error:', error_9);
                return [2 /*return*/, c.json({ error: 'Failed to update setting' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
export default admin;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11;
