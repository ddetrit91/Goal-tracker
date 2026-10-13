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
// client/src/server/auth.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '../db';
// <-- ДОБАВЛЕНО: activityLogs для записи в журнал
import { users, goals as goalsTable, tasks as tasksTable, categories as categoriesTable, activityLogs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
var auth = new Hono();
// --- СХЕМЫ ВАЛИДАЦИИ ---
var registerSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
    name: z.string().optional(),
});
var loginSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(1, 'Введите пароль'),
});
var createGoalSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    horizon: z.string(),
    category: z.string(),
    priority: z.string(),
    status: z.string().default('backlog'),
    startDate: z.string().nullable().optional(),
    targetDate: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional(),
    progress: z.number().optional(),
    isProgressCalculated: z.boolean().optional(),
    estimatedCost: z.number().nullable().optional(),
    currency: z.string().optional(),
    parentId: z.string().nullable().optional(),
    isTodayGoal: z.boolean().optional(),
});
var createTaskSchema = z.object({
    title: z.string().min(1),
    goalId: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.string().default('low'),
    category: z.string().optional(),
});
// --- АВТОРИЗАЦИЯ ---
auth.post('/register', zValidator('json', registerSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, name_1, existingUser, passwordHash, id, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = c.req.valid('json'), email = _a.email, password = _a.password, name_1 = _a.name;
                return [4 /*yield*/, db.select().from(users).where(eq(users.email, email)).get()];
            case 1:
                existingUser = _b.sent();
                if (existingUser)
                    return [2 /*return*/, c.json({ error: 'Пользователь с таким email уже существует' }, 409)];
                return [4 /*yield*/, bcrypt.hash(password, 10)];
            case 2:
                passwordHash = _b.sent();
                id = randomUUID();
                return [4 /*yield*/, db.insert(users).values({ id: id, email: email, passwordHash: passwordHash, name: name_1 || null, role: 'user' })];
            case 3:
                _b.sent();
                return [2 /*return*/, c.json({ message: 'Регистрация успешна', user: { id: id, email: email, name: name_1, role: 'user' } }, 201)];
            case 4:
                error_1 = _b.sent();
                console.error('Register error:', error_1);
                return [2 /*return*/, c.json({ error: 'Ошибка сервера при регистрации' }, 500)];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ЕДИНСТВЕННЫЙ ПРАВИЛЬНЫЙ БЛОК ЛОГИНА (С ЛОГИРОВАНИЕМ)
auth.post('/login', zValidator('json', loginSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, isValidPassword, now, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                _a = c.req.valid('json'), email = _a.email, password = _a.password;
                return [4 /*yield*/, db.select().from(users).where(eq(users.email, email)).get()];
            case 1:
                user = _b.sent();
                if (!user)
                    return [2 /*return*/, c.json({ error: 'Пользователь не найден' }, 404)];
                return [4 /*yield*/, bcrypt.compare(password, user.passwordHash)];
            case 2:
                isValidPassword = _b.sent();
                if (!isValidPassword)
                    return [2 /*return*/, c.json({ error: 'Неверный пароль' }, 401)];
                now = new Date().toISOString();
                return [4 /*yield*/, db.insert(activityLogs).values({
                        id: randomUUID(),
                        userId: user.id,
                        action: 'login',
                        createdAt: now,
                    })];
            case 3:
                _b.sent();
                return [4 /*yield*/, db.update(users).set({ lastLogin: now }).where(eq(users.id, user.id))];
            case 4:
                _b.sent();
                return [2 /*return*/, c.json({
                        message: 'Вход выполнен успешно',
                        user: { id: user.id, email: user.email, name: user.name, role: user.role }
                    })];
            case 5:
                error_2 = _b.sent();
                console.error('Login error:', error_2);
                return [2 /*return*/, c.json({ error: 'Ошибка сервера при входе' }, 500)];
            case 6: return [2 /*return*/];
        }
    });
}); });
// --- ЦЕЛИ ---
auth.get('/goals', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userGoals, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db.select().from(goalsTable).where(eq(goalsTable.userId, userId))];
            case 2:
                userGoals = _a.sent();
                return [2 /*return*/, c.json(userGoals)];
            case 3:
                error_3 = _a.sent();
                console.error('Fetch goals error:', error_3);
                return [2 /*return*/, c.json({ error: 'Ошибка при получении целей' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
auth.post('/goals', zValidator('json', createGoalSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, body, result, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                body = c.req.valid('json');
                return [4 /*yield*/, db.insert(goalsTable).values({
                        id: randomUUID(),
                        userId: userId,
                        title: body.title,
                        description: body.description || null,
                        category: body.category,
                        priority: body.priority,
                        horizon: body.horizon,
                        status: body.status || 'backlog',
                        startDate: body.startDate || null,
                        targetDate: body.targetDate || null,
                        parentId: body.parentId || null,
                        estimatedCost: body.estimatedCost || null,
                        currency: body.currency || 'UZS',
                        progress: 0,
                        isTodayGoal: body.isTodayGoal || false,
                    }).returning()];
            case 2:
                result = _a.sent();
                return [2 /*return*/, c.json(result[0], 201)];
            case 3:
                error_4 = _a.sent();
                console.error('Create goal error:', error_4);
                return [2 /*return*/, c.json({ error: 'Ошибка при создании цели' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
auth.put('/goals/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, body, existing, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                id = c.req.param('id');
                return [4 /*yield*/, c.req.json()];
            case 2:
                body = _a.sent();
                return [4 /*yield*/, db.select().from(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))).get()];
            case 3:
                existing = _a.sent();
                if (!existing)
                    return [2 /*return*/, c.json({ error: 'Цель не найдена' }, 404)];
                return [4 /*yield*/, db.update(goalsTable).set(body).where(eq(goalsTable.id, id)).returning()];
            case 4:
                result = _a.sent();
                return [2 /*return*/, c.json(result[0])];
            case 5:
                error_5 = _a.sent();
                console.error('Update goal error:', error_5);
                return [2 /*return*/, c.json({ error: 'Ошибка обновления цели' }, 500)];
            case 6: return [2 /*return*/];
        }
    });
}); });
auth.delete('/goals/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, existing, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                id = c.req.param('id');
                return [4 /*yield*/, db.select().from(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId))).get()];
            case 2:
                existing = _a.sent();
                if (!existing)
                    return [2 /*return*/, c.json({ error: 'Цель не найдена' }, 404)];
                return [4 /*yield*/, db.delete(goalsTable).where(eq(goalsTable.id, id))];
            case 3:
                _a.sent();
                return [2 /*return*/, c.json({ message: 'Цель успешно удалена' })];
            case 4:
                error_6 = _a.sent();
                console.error('Delete goal error:', error_6);
                return [2 /*return*/, c.json({ error: 'Ошибка удаления цели' }, 500)];
            case 5: return [2 /*return*/];
        }
    });
}); });
// --- ЗАДАЧИ ---
auth.get('/tasks', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userTasks, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db.select().from(tasksTable).where(eq(tasksTable.userId, userId))];
            case 2:
                userTasks = _a.sent();
                return [2 /*return*/, c.json(userTasks)];
            case 3:
                error_7 = _a.sent();
                console.error('Fetch tasks error:', error_7);
                return [2 /*return*/, c.json({ error: 'Ошибка при получении задач' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
auth.post('/tasks', zValidator('json', createTaskSchema), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, body, result, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                body = c.req.valid('json');
                return [4 /*yield*/, db.insert(tasksTable).values(__assign(__assign({ id: randomUUID(), userId: userId }, body), { isCompleted: false, isDailyFocus: false })).returning()];
            case 2:
                result = _a.sent();
                return [2 /*return*/, c.json(result[0], 201)];
            case 3:
                error_8 = _a.sent();
                console.error('Create task error:', error_8);
                return [2 /*return*/, c.json({ error: 'Ошибка при создании задачи' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
auth.put('/tasks/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, body, existing, result, updatedTask, goalTasks, subGoals, totalItems, completedTasks, completedSubGoals, newProgress, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 9, , 10]);
                id = c.req.param('id');
                return [4 /*yield*/, c.req.json()];
            case 2:
                body = _a.sent();
                return [4 /*yield*/, db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))).get()];
            case 3:
                existing = _a.sent();
                if (!existing)
                    return [2 /*return*/, c.json({ error: 'Задача не найдена' }, 404)];
                return [4 /*yield*/, db.update(tasksTable).set(body).where(eq(tasksTable.id, id)).returning()];
            case 4:
                result = _a.sent();
                updatedTask = result[0];
                if (!(updatedTask.goalId && (body.isCompleted !== undefined || body.completedAt !== undefined))) return [3 /*break*/, 8];
                return [4 /*yield*/, db.select().from(tasksTable).where(eq(tasksTable.goalId, updatedTask.goalId))];
            case 5:
                goalTasks = _a.sent();
                return [4 /*yield*/, db.select().from(goalsTable).where(eq(goalsTable.parentId, updatedTask.goalId))];
            case 6:
                subGoals = _a.sent();
                totalItems = goalTasks.length + subGoals.length;
                if (!(totalItems > 0)) return [3 /*break*/, 8];
                completedTasks = goalTasks.filter(function (t) { return t.isCompleted; }).length;
                completedSubGoals = subGoals.filter(function (g) { return g.status === 'completed'; }).length;
                newProgress = Math.round(((completedTasks + completedSubGoals) / totalItems) * 100);
                return [4 /*yield*/, db.update(goalsTable)
                        .set({ progress: newProgress })
                        .where(eq(goalsTable.id, updatedTask.goalId))];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8: return [2 /*return*/, c.json(updatedTask)];
            case 9:
                error_9 = _a.sent();
                console.error('Update task error:', error_9);
                return [2 /*return*/, c.json({ error: 'Ошибка обновления задачи' }, 500)];
            case 10: return [2 /*return*/];
        }
    });
}); });
auth.delete('/tasks/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, existing, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                id = c.req.param('id');
                return [4 /*yield*/, db.select().from(tasksTable).where(and(eq(tasksTable.id, id), eq(tasksTable.userId, userId))).get()];
            case 2:
                existing = _a.sent();
                if (!existing)
                    return [2 /*return*/, c.json({ error: 'Задача не найдена' }, 404)];
                return [4 /*yield*/, db.delete(tasksTable).where(eq(tasksTable.id, id))];
            case 3:
                _a.sent();
                return [2 /*return*/, c.json({ message: 'Задача успешно удалена' })];
            case 4:
                error_10 = _a.sent();
                console.error('Delete task error:', error_10);
                return [2 /*return*/, c.json({ error: 'Ошибка удаления задачи' }, 500)];
            case 5: return [2 /*return*/];
        }
    });
}); });
// --- КАТЕГОРИИ ---
auth.get('/categories', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, userCategories, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId))];
            case 2:
                userCategories = _a.sent();
                return [2 /*return*/, c.json(userCategories)];
            case 3:
                error_11 = _a.sent();
                console.error('Fetch categories error:', error_11);
                return [2 /*return*/, c.json({ error: 'Ошибка при получении категорий' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
auth.post('/categories', zValidator('json', z.object({
    name: z.string().min(1),
    colorHex: z.string(),
    iconName: z.string().optional(),
})), function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, body, result, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                body = c.req.valid('json');
                return [4 /*yield*/, db.insert(categoriesTable).values(__assign(__assign({ id: randomUUID(), userId: userId }, body), { isSystem: false })).returning()];
            case 2:
                result = _a.sent();
                return [2 /*return*/, c.json(result[0], 201)];
            case 3:
                error_12 = _a.sent();
                console.error('Create category error:', error_12);
                return [2 /*return*/, c.json({ error: 'Ошибка при создании категории' }, 500)];
            case 4: return [2 /*return*/];
        }
    });
}); });
auth.put('/categories/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, body, existing, result, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                id = c.req.param('id');
                return [4 /*yield*/, c.req.json()];
            case 2:
                body = _a.sent();
                return [4 /*yield*/, db.select().from(categoriesTable).where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId))).get()];
            case 3:
                existing = _a.sent();
                if (!existing)
                    return [2 /*return*/, c.json({ error: 'Категория не найдена' }, 404)];
                return [4 /*yield*/, db.update(categoriesTable).set(body).where(eq(categoriesTable.id, id)).returning()];
            case 4:
                result = _a.sent();
                return [2 /*return*/, c.json(result[0])];
            case 5:
                error_13 = _a.sent();
                console.error('Update category error:', error_13);
                return [2 /*return*/, c.json({ error: 'Ошибка обновления категории' }, 500)];
            case 6: return [2 /*return*/];
        }
    });
}); });
auth.delete('/categories/:id', function (c) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, id, existing, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = c.req.header('X-User-Id');
                if (!userId)
                    return [2 /*return*/, c.json({ error: 'Unauthorized' }, 401)];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                id = c.req.param('id');
                return [4 /*yield*/, db.select().from(categoriesTable).where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId))).get()];
            case 2:
                existing = _a.sent();
                if (!existing)
                    return [2 /*return*/, c.json({ error: 'Категория не найдена' }, 404)];
                return [4 /*yield*/, db.delete(categoriesTable).where(eq(categoriesTable.id, id))];
            case 3:
                _a.sent();
                return [2 /*return*/, c.json({ message: 'Категория успешно удалена' })];
            case 4:
                error_14 = _a.sent();
                console.error('Delete category error:', error_14);
                return [2 /*return*/, c.json({ error: 'Ошибка удаления категории' }, 500)];
            case 5: return [2 /*return*/];
        }
    });
}); });
export default auth;
