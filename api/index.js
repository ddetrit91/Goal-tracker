var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/src/serverless.ts
import { getRequestListener } from "@hono/node-server";

// server/src/app.ts
import { Hono as Hono3 } from "hono";
import { cors } from "hono/cors";
import { eq as eq3 } from "drizzle-orm";
import bcrypt3 from "bcryptjs";
import dotenv2 from "dotenv";

// server/src/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// server/src/db/index.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// server/src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  activityLogs: () => activityLogs,
  categories: () => categories,
  events: () => events,
  goals: () => goals,
  settings: () => settings,
  tasks: () => tasks,
  users: () => users
});
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
var users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role").default("user"),
  // 'user' | 'admin'
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  lastLogin: text("last_login"),
  lastIp: text("last_ip"),
  lastCity: text("last_city")
});
var goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  priority: text("priority").notNull(),
  horizon: text("horizon").notNull(),
  progress: integer("progress").default(0),
  parentId: text("parent_id"),
  targetDate: text("target_date"),
  startDate: text("start_date"),
  status: text("status").default("backlog"),
  isTodayGoal: integer("is_today_goal", { mode: "boolean" }).default(false),
  estimatedCost: real("estimated_cost"),
  currency: text("currency").default("UZS"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`)
});
var tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  isDailyFocus: integer("is_daily_focus", { mode: "boolean" }).default(false),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  category: text("category"),
  priority: text("priority").default("low"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`)
});
var categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  colorHex: text("color_hex").notNull(),
  iconName: text("icon_name"),
  isSystem: integer("is_system", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`)
});
var activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  ipAddress: text("ip_address"),
  city: text("city"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`)
});
var settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`)
});
var events = sqliteTable("events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  remindDaysBefore: integer("remind_days_before").default(2),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  completedAt: text("completed_at"),
  category: text("category").default("personal"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`)
});

// server/src/db/index.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
function clean(val) {
  if (!val) return val;
  return val.trim().replace(/^["']|["']$/g, "").trim();
}
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var defaultLocalDbPath = `file:${path.resolve(__dirname, "../../local.db").replace(/\\/g, "/")}`;
var rawUrl = clean(process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL);
var url = rawUrl;
if (!url) {
  url = defaultLocalDbPath;
} else if (url.startsWith("file:") && !path.isAbsolute(url.slice(5))) {
  url = `file:${path.resolve(__dirname, "../../", url.slice(5)).replace(/\\/g, "/")}`;
} else if (url.startsWith("./") || url.startsWith("../")) {
  url = `file:${path.resolve(__dirname, "../../", url).replace(/\\/g, "/")}`;
}
var authToken = clean(process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN);
console.log(`\u{1F50C} Database connecting to: ${url?.startsWith("libsql://") ? url.slice(0, 25) + "..." : url}`);
var client = createClient({
  url,
  authToken
});
var db = drizzle(client, { schema: schema_exports });

// server/src/routes/auth.ts
import { eq, and, asc } from "drizzle-orm";

// server/src/utils/geoIp.ts
var geoCache = /* @__PURE__ */ new Map();
var TIMEZONE_TO_CITY = {
  "Asia/Tashkent": "\u0422\u0430\u0448\u043A\u0435\u043D\u0442",
  "Asia/Samarkand": "\u0421\u0430\u043C\u0430\u0440\u043A\u0430\u043D\u0434",
  "Europe/Moscow": "\u041C\u043E\u0441\u043A\u0432\u0430",
  "Europe/Kaliningrad": "\u041A\u0430\u043B\u0438\u043D\u0438\u043D\u0433\u0440\u0430\u0434",
  "Europe/Samara": "\u0421\u0430\u043C\u0430\u0440\u0430",
  "Asia/Yekaterinburg": "\u0415\u043A\u0430\u0442\u0435\u0440\u0438\u043D\u0431\u0443\u0440\u0433",
  "Asia/Omsk": "\u041E\u043C\u0441\u043A",
  "Asia/Novosibirsk": "\u041D\u043E\u0432\u043E\u0441\u0438\u0431\u0438\u0440\u0441\u043A",
  "Asia/Krasnoyarsk": "\u041A\u0440\u0430\u0441\u043D\u043E\u044F\u0440\u0441\u043A",
  "Asia/Irkutsk": "\u0418\u0440\u043A\u0443\u0442\u0441\u043A",
  "Asia/Yakutsk": "\u042F\u043A\u0443\u0442\u0441\u043A",
  "Asia/Vladivostok": "\u0412\u043B\u0430\u0434\u0438\u0432\u043E\u0441\u0442\u043E\u043A",
  "Europe/Minsk": "\u041C\u0438\u043D\u0441\u043A",
  "Asia/Almaty": "\u0410\u043B\u043C\u0430\u0442\u044B",
  "Asia/Astana": "\u0410\u0441\u0442\u0430\u043D\u0430",
  "Asia/Qyzylorda": "\u041A\u044B\u0437\u044B\u043B\u043E\u0440\u0434\u0430",
  "Asia/Bishkek": "\u0411\u0438\u0448\u043A\u0435\u043A",
  "Asia/Dushanbe": "\u0414\u0443\u0448\u0430\u043D\u0431\u0435",
  "Asia/Baku": "\u0411\u0430\u043A\u0443",
  "Asia/Tbilisi": "\u0422\u0431\u0438\u043B\u0438\u0441\u0438",
  "Asia/Yerevan": "\u0415\u0440\u0435\u0432\u0430\u043D",
  "Europe/Kyiv": "\u041A\u0438\u0435\u0432",
  "Asia/Dubai": "\u0414\u0443\u0431\u0430\u0439",
  "Asia/Istanbul": "\u0421\u0442\u0430\u043C\u0431\u0443\u043B",
  "Europe/London": "\u041B\u043E\u043D\u0434\u043E\u043D",
  "Europe/Berlin": "\u0411\u0435\u0440\u043B\u0438\u043D",
  "Europe/Paris": "\u041F\u0430\u0440\u0438\u0436",
  "America/New_York": "\u041D\u044C\u044E-\u0419\u043E\u0440\u043A",
  "America/Los_Angeles": "\u041B\u043E\u0441-\u0410\u043D\u0434\u0436\u0435\u043B\u0435\u0441"
};
var CITY_NAME_RU = {
  "tashkent": "\u0422\u0430\u0448\u043A\u0435\u043D\u0442",
  "samarkand": "\u0421\u0430\u043C\u0430\u0440\u043A\u0430\u043D\u0434",
  "bukhara": "\u0411\u0443\u0445\u0430\u0440\u0430",
  "andijan": "\u0410\u043D\u0434\u0438\u0436\u0430\u043D",
  "namangan": "\u041D\u0430\u043C\u0430\u043D\u0433\u0430\u043D",
  "fergana": "\u0424\u0435\u0440\u0433\u0430\u043D\u0430",
  "nukus": "\u041D\u0443\u043A\u0443\u0441",
  "moscow": "\u041C\u043E\u0441\u043A\u0432\u0430",
  "saint petersburg": "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433",
  "almaty": "\u0410\u043B\u043C\u0430\u0442\u044B",
  "astana": "\u0410\u0441\u0442\u0430\u043D\u0430",
  "minsk": "\u041C\u0438\u043D\u0441\u043A",
  "bishkek": "\u0411\u0438\u0448\u043A\u0435\u043A",
  "dushanbe": "\u0414\u0443\u0448\u0430\u043D\u0431\u0435",
  "baku": "\u0411\u0430\u043A\u0443",
  "tbilisi": "\u0422\u0431\u0438\u043B\u0438\u0441\u0438",
  "yerevan": "\u0415\u0440\u0435\u0432\u0430\u043D",
  "kyiv": "\u041A\u0438\u0435\u0432",
  "kiev": "\u041A\u0438\u0435\u0432",
  "dubai": "\u0414\u0443\u0431\u0430\u0439",
  "istanbul": "\u0421\u0442\u0430\u043C\u0431\u0443\u043B",
  "london": "\u041B\u043E\u043D\u0434\u043E\u043D",
  "berlin": "\u0411\u0435\u0440\u043B\u0438\u043D",
  "paris": "\u041F\u0430\u0440\u0438\u0436",
  "new york": "\u041D\u044C\u044E-\u0419\u043E\u0440\u043A"
};
function formatCityName(rawCity) {
  const trimmed = rawCity.trim();
  const lower = trimmed.toLowerCase();
  if (CITY_NAME_RU[lower]) {
    return CITY_NAME_RU[lower];
  }
  return trimmed;
}
function isPrivateIp(ip) {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.16.") || ip.startsWith("172.31.")) return true;
  return false;
}
function extractClientIp(c) {
  const cfIp = c.req.header("cf-connecting-ip");
  const vercelIp = c.req.header("x-vercel-forwarded-for");
  const realIp = c.req.header("x-real-ip");
  const forwardedFor = c.req.header("x-forwarded-for");
  let ip = cfIp || vercelIp || realIp;
  if (!ip && forwardedFor) {
    ip = forwardedFor.split(",")[0].trim();
  }
  if (!ip) {
    try {
      ip = c.env?.incoming?.socket?.remoteAddress || "127.0.0.1";
    } catch {
      ip = "127.0.0.1";
    }
  }
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  if (ip === "::1") {
    ip = "127.0.0.1";
  }
  return ip || "127.0.0.1";
}
async function resolveClientCity(c, ip) {
  const vercelCity = c.req.header("x-vercel-ip-city");
  if (vercelCity) {
    try {
      const decoded = decodeURIComponent(vercelCity);
      if (decoded && decoded !== "Unknown") return formatCityName(decoded);
    } catch {
    }
  }
  const cfCity = c.req.header("cf-ipcity");
  if (cfCity && cfCity !== "Unknown") {
    return formatCityName(cfCity);
  }
  const clientCityHeader = c.req.header("x-client-city");
  if (clientCityHeader) {
    try {
      const decoded = decodeURIComponent(clientCityHeader);
      if (decoded && decoded !== "Unknown") return formatCityName(decoded);
    } catch {
      return formatCityName(clientCityHeader);
    }
  }
  const clientTz = c.req.header("x-client-timezone");
  if (clientTz && TIMEZONE_TO_CITY[clientTz]) {
    const cityName = TIMEZONE_TO_CITY[clientTz];
    if (isPrivateIp(ip)) {
      return `${cityName} (\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E)`;
    }
    return cityName;
  }
  if (isPrivateIp(ip)) {
    return "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E";
  }
  if (geoCache.has(ip)) {
    return geoCache.get(ip);
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=city,status&lang=ru`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === "success" && data.city) {
        const city = formatCityName(data.city);
        geoCache.set(ip, city);
        return city;
      }
    }
  } catch {
  }
  return "\u041D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D";
}

// server/src/routes/auth.ts
var auth = new Hono();
var registerSchema = z.object({
  email: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email"),
  password: z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u0435\u0435 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"),
  name: z.string().optional()
});
var loginSchema = z.object({
  email: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email"),
  password: z.string().min(1, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0430\u0440\u043E\u043B\u044C")
});
var createGoalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  horizon: z.string(),
  category: z.string(),
  priority: z.string(),
  status: z.string().default("backlog"),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  progress: z.number().optional(),
  isProgressCalculated: z.boolean().optional(),
  estimatedCost: z.number().nullable().optional(),
  currency: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isTodayGoal: z.boolean().optional()
});
var createTaskSchema = z.object({
  title: z.string().min(1),
  goalId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.string().default("low"),
  category: z.string().optional()
});
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  try {
    const { email, password, name } = c.req.valid("json");
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) return c.json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" }, 409);
    const ip = extractClientIp(c);
    const city = await resolveClientCity(c, ip);
    const passwordHash = await bcrypt.hash(password, 10);
    const id = randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name: name || null,
      role: "user",
      lastLogin: now,
      lastIp: ip,
      lastCity: city
    });
    await db.insert(activityLogs).values({
      id: randomUUID(),
      userId: id,
      action: "register",
      ipAddress: ip,
      city,
      createdAt: now
    });
    return c.json({ message: "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u0430", user: { id, email, name, role: "user" } }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438" }, 500);
  }
});
auth.post("/login", zValidator("json", loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid("json");
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) return c.json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }, 404);
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) return c.json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C" }, 401);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const ip = extractClientIp(c);
    const city = await resolveClientCity(c, ip);
    await db.insert(activityLogs).values({
      id: randomUUID(),
      userId: user.id,
      action: "login",
      ipAddress: ip,
      city,
      createdAt: now
    });
    await db.update(users).set({
      lastLogin: now,
      lastIp: ip,
      lastCity: city
    }).where(eq(users.id, user.id));
    return c.json({
      message: "\u0412\u0445\u043E\u0434 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D \u0443\u0441\u043F\u0435\u0448\u043D\u043E",
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0432\u0445\u043E\u0434\u0435" }, 500);
  }
});
var resetCodeStore = /* @__PURE__ */ new Map();
var forgotPasswordSchema = z.object({
  email: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email")
});
var resetPasswordSchema = z.object({
  email: z.string().email("\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email"),
  code: z.string().min(4, "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F"),
  newPassword: z.string().min(6, "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u0435\u0435 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432")
});
auth.post("/forgot-password", zValidator("json", forgotPasswordSchema), async (c) => {
  try {
    const { email } = c.req.valid("json");
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();
    if (!user) {
      return c.json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }, 404);
    }
    const code = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresAt = Date.now() + 15 * 60 * 1e3;
    resetCodeStore.set(normalizedEmail, { code, expiresAt });
    console.log(`\u{1F511} \u041A\u043E\u0434 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0430\u0440\u043E\u043B\u044F \u0434\u043B\u044F ${normalizedEmail}: ${code}`);
    return c.json({
      message: "\u041A\u043E\u0434 \u0434\u043B\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0430\u0440\u043E\u043B\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u0444\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D",
      email: normalizedEmail,
      code
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u0441\u0431\u0440\u043E\u0441\u0435 \u043F\u0430\u0440\u043E\u043B\u044F" }, 500);
  }
});
auth.post("/reset-password", zValidator("json", resetPasswordSchema), async (c) => {
  try {
    const { email, code, newPassword } = c.req.valid("json");
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();
    if (!user) {
      return c.json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" }, 404);
    }
    const savedRecord = resetCodeStore.get(normalizedEmail);
    if (!savedRecord) {
      return c.json({ error: "\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0441\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u0443\u0441\u0442\u0430\u0440\u0435\u043B. \u0417\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u043A\u043E\u0434 \u0437\u0430\u043D\u043E\u0432\u043E." }, 400);
    }
    if (Date.now() > savedRecord.expiresAt) {
      resetCodeStore.delete(normalizedEmail);
      return c.json({ error: "\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u043A\u043E\u0434\u0430 \u0438\u0441\u0442\u0451\u043A. \u0417\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u043D\u043E\u0432\u044B\u0439 \u043A\u043E\u0434." }, 400);
    }
    if (savedRecord.code !== code.trim()) {
      return c.json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u0447\u043D\u044B\u0439 \u043A\u043E\u0434" }, 400);
    }
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, user.id));
    resetCodeStore.delete(normalizedEmail);
    try {
      await db.insert(activityLogs).values({
        id: randomUUID(),
        userId: user.id,
        action: "password_reset",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch {
    }
    return c.json({ message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0438\u0437\u043C\u0435\u043D\u0451\u043D! \u0422\u0435\u043F\u0435\u0440\u044C \u0432\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u0432\u043E\u0439\u0442\u0438 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0443." });
  } catch (error) {
    console.error("Reset password error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0430\u0440\u043E\u043B\u044F" }, 500);
  }
});
auth.get("/goals", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const userGoals = await db.select().from(goals).where(eq(goals.userId, userId));
    return c.json(userGoals);
  } catch (error) {
    console.error("Fetch goals error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0446\u0435\u043B\u0435\u0439" }, 500);
  }
});
auth.post("/goals", zValidator("json", createGoalSchema), async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = c.req.valid("json");
    const result = await db.insert(goals).values({
      id: randomUUID(),
      userId,
      title: body.title,
      description: body.description || null,
      category: body.category,
      priority: body.priority,
      horizon: body.horizon,
      status: body.status || "backlog",
      startDate: body.startDate || null,
      targetDate: body.targetDate || null,
      parentId: body.parentId || null,
      estimatedCost: body.estimatedCost || null,
      currency: body.currency || "UZS",
      progress: 0,
      isTodayGoal: body.isTodayGoal || false
    }).returning();
    return c.json(result[0], 201);
  } catch (error) {
    console.error("Create goal error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0446\u0435\u043B\u0438" }, 500);
  }
});
async function recalculateGoalHierarchy(goalId, userId) {
  const goal = await db.select().from(goals).where(
    and(eq(goals.id, goalId), eq(goals.userId, userId))
  ).get();
  if (!goal) return;
  const childTasks = await db.select().from(tasks).where(
    and(eq(tasks.goalId, goalId), eq(tasks.userId, userId))
  );
  const childGoals = await db.select().from(goals).where(
    and(eq(goals.parentId, goalId), eq(goals.userId, userId))
  );
  const totalItems = childTasks.length + childGoals.length;
  let newProgress = 0;
  if (totalItems > 0) {
    const tasksProgress = childTasks.reduce((sum, t) => sum + (t.isCompleted ? 100 : 0), 0);
    const goalsProgress = childGoals.reduce((sum, g) => {
      if (g.status === "completed") return sum + 100;
      return sum + Math.min(100, Math.max(0, g.progress ?? 0));
    }, 0);
    newProgress = Math.min(100, Math.max(0, Math.round((tasksProgress + goalsProgress) / totalItems)));
  } else {
    newProgress = goal.status === "completed" ? 100 : 0;
  }
  if (goal.progress !== newProgress) {
    await db.update(goals).set({ progress: newProgress }).where(eq(goals.id, goalId));
  }
  if (goal.parentId) {
    await recalculateGoalHierarchy(goal.parentId, userId);
  }
}
auth.put("/goals/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await db.select().from(goals).where(
      and(eq(goals.id, id), eq(goals.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u0426\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }, 404);
    const result = await db.update(goals).set(body).where(eq(goals.id, id)).returning();
    const updatedGoal = result[0];
    if (body.status !== void 0 && body.progress === void 0) {
      await recalculateGoalHierarchy(id, userId);
    } else if (updatedGoal.parentId && (body.status !== void 0 || body.progress !== void 0)) {
      await recalculateGoalHierarchy(updatedGoal.parentId, userId);
    }
    return c.json(updatedGoal);
  } catch (error) {
    console.error("Update goal error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0446\u0435\u043B\u0438" }, 500);
  }
});
auth.delete("/goals/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const existing = await db.select().from(goals).where(
      and(eq(goals.id, id), eq(goals.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u0426\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }, 404);
    await db.delete(goals).where(eq(goals.id, id));
    if (existing.parentId) {
      await recalculateGoalHierarchy(existing.parentId, userId);
    }
    return c.json({ message: "\u0426\u0435\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430" });
  } catch (error) {
    console.error("Delete goal error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0446\u0435\u043B\u0438" }, 500);
  }
});
auth.get("/tasks", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return c.json(userTasks);
  } catch (error) {
    console.error("Fetch tasks error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0437\u0430\u0434\u0430\u0447" }, 500);
  }
});
auth.post("/tasks", zValidator("json", createTaskSchema), async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = c.req.valid("json");
    const result = await db.insert(tasks).values({
      id: randomUUID(),
      userId,
      ...body,
      isCompleted: false,
      isDailyFocus: false
    }).returning();
    const newTask = result[0];
    if (newTask.goalId) {
      await recalculateGoalHierarchy(newTask.goalId, userId);
    }
    return c.json(newTask, 201);
  } catch (error) {
    console.error("Create task error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0437\u0430\u0434\u0430\u0447\u0438" }, 500);
  }
});
auth.put("/tasks/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await db.select().from(tasks).where(
      and(eq(tasks.id, id), eq(tasks.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u0417\u0430\u0434\u0430\u0447\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }, 404);
    const result = await db.update(tasks).set(body).where(eq(tasks.id, id)).returning();
    const updatedTask = result[0];
    if (updatedTask.goalId) {
      await recalculateGoalHierarchy(updatedTask.goalId, userId);
    }
    if (existing.goalId && existing.goalId !== updatedTask.goalId) {
      await recalculateGoalHierarchy(existing.goalId, userId);
    }
    return c.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438" }, 500);
  }
});
auth.delete("/tasks/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const existing = await db.select().from(tasks).where(
      and(eq(tasks.id, id), eq(tasks.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u0417\u0430\u0434\u0430\u0447\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }, 404);
    await db.delete(tasks).where(eq(tasks.id, id));
    if (existing.goalId) {
      await recalculateGoalHierarchy(existing.goalId, userId);
    }
    return c.json({ message: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430" });
  } catch (error) {
    console.error("Delete task error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438" }, 500);
  }
});
auth.get("/categories", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const userCategories = await db.select().from(categories).where(eq(categories.userId, userId));
    return c.json(userCategories);
  } catch (error) {
    console.error("Fetch categories error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0439" }, 500);
  }
});
auth.post("/categories", zValidator("json", z.object({
  name: z.string().min(1),
  colorHex: z.string(),
  iconName: z.string().optional()
})), async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = c.req.valid("json");
    const result = await db.insert(categories).values({
      id: randomUUID(),
      userId,
      ...body,
      isSystem: false
    }).returning();
    return c.json(result[0], 201);
  } catch (error) {
    console.error("Create category error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }, 500);
  }
});
auth.put("/categories/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await db.select().from(categories).where(
      and(eq(categories.id, id), eq(categories.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }, 404);
    const result = await db.update(categories).set(body).where(eq(categories.id, id)).returning();
    return c.json(result[0]);
  } catch (error) {
    console.error("Update category error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }, 500);
  }
});
auth.delete("/categories/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const existing = await db.select().from(categories).where(
      and(eq(categories.id, id), eq(categories.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" }, 404);
    await db.delete(categories).where(eq(categories.id, id));
    return c.json({ message: "\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0430" });
  } catch (error) {
    console.error("Delete category error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438" }, 500);
  }
});
var createEventSchema = z.object({
  title: z.string().min(1, "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"),
  description: z.string().optional().nullable(),
  eventDate: z.string().min(1, "\u0414\u0430\u0442\u0430 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430"),
  eventTime: z.string().optional().nullable(),
  remindDaysBefore: z.number().int().min(0).default(2),
  category: z.string().default("personal")
});
auth.get("/events", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const userEvents = await db.select().from(events).where(eq(events.userId, userId)).orderBy(asc(events.eventDate), asc(events.eventTime));
    return c.json(userEvents);
  } catch (error) {
    console.error("Fetch events error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u0439" }, 500);
  }
});
auth.post("/events", zValidator("json", createEventSchema), async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const body = c.req.valid("json");
    const result = await db.insert(events).values({
      id: randomUUID(),
      userId,
      title: body.title,
      description: body.description || null,
      eventDate: body.eventDate,
      eventTime: body.eventTime || null,
      remindDaysBefore: body.remindDaysBefore ?? 2,
      category: body.category || "personal",
      isCompleted: false,
      completedAt: null
    }).returning();
    return c.json(result[0], 201);
  } catch (error) {
    console.error("Create event error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0441\u043E\u0431\u044B\u0442\u0438\u044F" }, 500);
  }
});
auth.put("/events/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await db.select().from(events).where(
      and(eq(events.id, id), eq(events.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" }, 404);
    const result = await db.update(events).set(body).where(eq(events.id, id)).returning();
    return c.json(result[0]);
  } catch (error) {
    console.error("Update event error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u043E\u0431\u044B\u0442\u0438\u044F" }, 500);
  }
});
auth.delete("/events/:id", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const id = c.req.param("id");
    const existing = await db.select().from(events).where(
      and(eq(events.id, id), eq(events.userId, userId))
    ).get();
    if (!existing) return c.json({ error: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" }, 404);
    await db.delete(events).where(eq(events.id, id));
    return c.json({ message: "\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u043E" });
  } catch (error) {
    console.error("Delete event error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0441\u043E\u0431\u044B\u0442\u0438\u044F" }, 500);
  }
});
auth.get("/backup", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const goals2 = await db.select().from(goals).where(eq(goals.userId, userId));
    const tasks2 = await db.select().from(tasks).where(eq(tasks.userId, userId));
    const categories2 = await db.select().from(categories).where(eq(categories.userId, userId));
    return c.json({
      goals: goals2,
      tasks: tasks2,
      categories: categories2,
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: "0.1.0"
    });
  } catch (error) {
    console.error("Backup export error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0435 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438" }, 500);
  }
});
auth.post("/backup", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    const data = await c.req.json();
    if (!data || !Array.isArray(data.goals) || !Array.isArray(data.tasks)) {
      return c.json({ error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u0431\u044D\u043A\u0430\u043F\u0430" }, 400);
    }
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(goals).where(eq(goals.userId, userId));
    await db.delete(categories).where(eq(categories.userId, userId));
    if (data.categories && data.categories.length > 0) {
      for (const cat of data.categories) {
        await db.insert(categories).values({
          id: cat.id || randomUUID(),
          userId,
          name: cat.name,
          colorHex: cat.colorHex,
          iconName: cat.iconName || null,
          isSystem: Boolean(cat.isSystem),
          createdAt: cat.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: cat.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    if (data.goals && data.goals.length > 0) {
      for (const g of data.goals) {
        await db.insert(goals).values({
          id: g.id || randomUUID(),
          userId,
          title: g.title,
          description: g.description || null,
          category: g.category || "self-development",
          priority: g.priority || "medium",
          horizon: g.horizon || "quarterly",
          progress: typeof g.progress === "number" ? g.progress : 0,
          parentId: g.parentId || null,
          startDate: g.startDate || null,
          targetDate: g.targetDate || null,
          status: g.status || "backlog",
          isTodayGoal: Boolean(g.isTodayGoal),
          estimatedCost: typeof g.estimatedCost === "number" ? g.estimatedCost : null,
          currency: g.currency || "UZS",
          createdAt: g.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    if (data.tasks && data.tasks.length > 0) {
      for (const t of data.tasks) {
        await db.insert(tasks).values({
          id: t.id || randomUUID(),
          userId,
          goalId: t.goalId || null,
          title: t.title,
          isCompleted: Boolean(t.isCompleted),
          isDailyFocus: Boolean(t.isDailyFocus),
          dueDate: t.dueDate || null,
          completedAt: t.completedAt || null,
          category: t.category || null,
          priority: t.priority || "low",
          createdAt: t.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    return c.json({ message: "\u0420\u0435\u0437\u0435\u0440\u0432\u043D\u0430\u044F \u043A\u043E\u043F\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430" });
  } catch (error) {
    console.error("Backup import error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0438\u0437 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u043E\u0439 \u043A\u043E\u043F\u0438\u0438" }, 500);
  }
});
auth.delete("/user/data", async (c) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  try {
    await db.delete(events).where(eq(events.userId, userId));
    await db.delete(tasks).where(eq(tasks.userId, userId));
    await db.delete(goals).where(eq(goals.userId, userId));
    await db.delete(categories).where(eq(categories.userId, userId));
    return c.json({ message: "\u0412\u0441\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u044B" });
  } catch (error) {
    console.error("Clear user data error:", error);
    return c.json({ error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" }, 500);
  }
});
var auth_default = auth;

// server/src/routes/admin.ts
import { Hono as Hono2 } from "hono";
import { eq as eq2, count, sql as sql2, and as and2, isNull } from "drizzle-orm";
import bcrypt2 from "bcryptjs";
import { randomUUID as randomUUID2 } from "crypto";
var admin = new Hono2();
admin.use("*", async (c, next) => {
  const userId = c.req.header("X-User-Id");
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const user = await db.select().from(users).where(eq2(users.id, userId)).get();
  if (!user || user.role !== "admin") {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }
  await next();
});
admin.get("/users", async (c) => {
  try {
    const userList = await db.select().from(users);
    const usersWithGoals = await Promise.all(
      userList.map(async (user) => {
        const mainGoals = await db.select({ count: count() }).from(goals).where(and2(
          eq2(goals.userId, user.id),
          isNull(goals.parentId)
        ));
        return {
          ...user,
          goalCount: mainGoals[0]?.count || 0
        };
      })
    );
    return c.json(usersWithGoals);
  } catch (error) {
    console.error("Fetch users error:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});
admin.post("/users", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: "Email \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B" }, 400);
    }
    const existingUser = await db.select().from(users).where(eq2(users.email, email)).get();
    if (existingUser) {
      return c.json({ error: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" }, 409);
    }
    const passwordHash = await bcrypt2.hash(password, 10);
    const id = randomUUID2();
    await db.insert(users).values({
      id,
      email,
      passwordHash,
      name: name || null,
      role: role || "user"
    });
    return c.json({ message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441\u043E\u0437\u0434\u0430\u043D", user: { id, email, name, role } }, 201);
  } catch (error) {
    console.error("Create user error:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});
admin.put("/users/:id/role", async (c) => {
  try {
    const id = c.req.param("id");
    const { role } = await c.req.json();
    if (role !== "admin") {
      const admins = await db.select({ count: count() }).from(users).where(eq2(users.role, "admin"));
      const adminCount = admins[0]?.count ?? 0;
      if (adminCount <= 1) {
        return c.json({ error: "Cannot remove the last admin" }, 400);
      }
    }
    await db.update(users).set({ role }).where(eq2(users.id, id));
    return c.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Update role error:", error);
    return c.json({ error: "Failed to update role" }, 500);
  }
});
admin.post("/users/:id/reset-password", async (c) => {
  try {
    const id = c.req.param("id");
    const { newPassword } = await c.req.json();
    if (!newPassword || newPassword.length < 6) {
      return c.json({ error: "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u0435\u0435 6 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432" }, 400);
    }
    const hash = await bcrypt2.hash(newPassword, 10);
    await db.update(users).set({ passwordHash: hash }).where(eq2(users.id, id));
    return c.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return c.json({ error: "Failed to reset password" }, 500);
  }
});
admin.delete("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const currentUserId = c.req.header("X-User-Id");
    if (id === currentUserId) {
      return c.json({ error: "Cannot delete yourself" }, 400);
    }
    await db.delete(users).where(eq2(users.id, id));
    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return c.json({ error: "Failed to delete user" }, 500);
  }
});
admin.get("/stats", async (c) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const totalUsersResult = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;
    const activeTodayResult = await db.select({ count: count() }).from(users).where(sql2`date(last_login) = date(${today})`);
    const activeToday = activeTodayResult[0]?.count || 0;
    const requestsTodayResult = await db.select({ count: count() }).from(activityLogs).where(sql2`date(created_at) = date(${today})`);
    const requestsToday = requestsTodayResult[0]?.count || 0;
    const registrationsByDay = await db.select({
      date: sql2`date(created_at)`.as("date"),
      count: count()
    }).from(users).groupBy(sql2`date(created_at)`).orderBy(sql2`date(created_at) DESC`).limit(7);
    const requestsByDay = await db.select({
      date: sql2`date(created_at)`.as("date"),
      count: count()
    }).from(activityLogs).groupBy(sql2`date(created_at)`).orderBy(sql2`date(created_at) DESC`).limit(7);
    return c.json({
      totalUsers,
      activeToday,
      requestsToday,
      registrationsByDay,
      requestsByDay
    });
  } catch (error) {
    console.error("Fetch stats error:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});
admin.get("/activity", async (c) => {
  try {
    const logs = await db.select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      lastLogin: sql2`COALESCE(MAX(${activityLogs.createdAt}), ${users.lastLogin}, ${users.createdAt})`.as("last_login"),
      requestCount: sql2`COUNT(${activityLogs.id})`.as("request_count"),
      ipAddress: sql2`COALESCE(
        (SELECT al.ip_address FROM activity_logs al WHERE al.user_id = ${users.id} AND al.ip_address IS NOT NULL AND al.ip_address != '' ORDER BY al.created_at DESC LIMIT 1),
        ${users.lastIp},
        '127.0.0.1'
      )`.as("ip_address"),
      city: sql2`COALESCE(
        (SELECT al.city FROM activity_logs al WHERE al.user_id = ${users.id} AND al.city IS NOT NULL AND al.city != '' ORDER BY al.created_at DESC LIMIT 1),
        ${users.lastCity},
        'Локально'
      )`.as("city")
    }).from(users).leftJoin(activityLogs, eq2(users.id, activityLogs.userId)).groupBy(users.id, users.name, users.email, users.role, users.createdAt, users.lastLogin, users.lastIp, users.lastCity).orderBy(sql2`COALESCE(MAX(${activityLogs.createdAt}), ${users.lastLogin}, ${users.createdAt}) DESC`).limit(100);
    return c.json(logs);
  } catch (error) {
    console.error("Fetch activity error:", error);
    return c.json({ error: "Failed to fetch activity" }, 500);
  }
});
admin.get("/settings", async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    return c.json(allSettings);
  } catch (error) {
    console.error("Fetch settings error:", error);
    return c.json({ error: "Failed to fetch settings" }, 500);
  }
});
admin.put("/settings", async (c) => {
  try {
    const { key, value } = await c.req.json();
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: (/* @__PURE__ */ new Date()).toISOString() } });
    return c.json({ message: "Setting updated successfully" });
  } catch (error) {
    console.error("Update setting error:", error);
    return c.json({ error: "Failed to update setting" }, 500);
  }
});
var admin_default = admin;

// server/src/app.ts
dotenv2.config();
function clean2(val) {
  if (!val) return val;
  return val.trim().replace(/^["']|["']$/g, "").trim();
}
var clientOrigin = clean2(process.env.CLIENT_ORIGIN) || "http://localhost:5173";
var adminEmail = clean2(process.env.ADMIN_EMAIL) || "admin@goaltracker.local";
var adminPassword = clean2(process.env.ADMIN_PASSWORD) || "AdminPass123!";
var isInitialized = false;
async function ensureDbInitialized() {
  if (isInitialized) return;
  isInitialized = true;
  try {
    console.log("\u{1F527} Checking database schema & admin account...");
    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          event_date TEXT NOT NULL,
          event_time TEXT,
          remind_days_before INTEGER DEFAULT 2,
          is_completed INTEGER DEFAULT 0,
          completed_at TEXT,
          category TEXT DEFAULT 'personal',
          created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
        )
      `);
      console.log("\u2705 Events table verified/created");
    } catch (e) {
      console.warn("\u26A0\uFE0F Events table check warning:", e?.message);
    }
    const columnsToAdd = [
      { name: "start_date", sql: "ALTER TABLE goals ADD COLUMN start_date TEXT" },
      { name: "status", sql: "ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'backlog'" },
      { name: "is_today_goal", sql: "ALTER TABLE goals ADD COLUMN is_today_goal INTEGER DEFAULT 0" },
      { name: "completed_at", sql: "ALTER TABLE goals ADD COLUMN completed_at TEXT" },
      { name: "role", sql: "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'" },
      { name: "last_ip", sql: "ALTER TABLE users ADD COLUMN last_ip TEXT" },
      { name: "last_city", sql: "ALTER TABLE users ADD COLUMN last_city TEXT" },
      { name: "ip_address", sql: "ALTER TABLE activity_logs ADD COLUMN ip_address TEXT" },
      { name: "city", sql: "ALTER TABLE activity_logs ADD COLUMN city TEXT" },
      { name: "completed_at", sql: "ALTER TABLE events ADD COLUMN completed_at TEXT" }
    ];
    for (const col of columnsToAdd) {
      try {
        await client.execute(col.sql);
        console.log(`\u2705 Added column: ${col.name}`);
      } catch (e) {
        const msg = (e.message || "").toLowerCase();
        if (msg.includes("duplicate") || msg.includes("already exists")) {
        } else {
        }
      }
    }
    try {
      const existingAdmin = await db.select().from(users).where(eq3(users.email, adminEmail)).get();
      if (!existingAdmin) {
        console.log("\u{1F511} Creating default admin account...");
        const hash = await bcrypt3.hash(adminPassword, 10);
        await db.insert(users).values({
          id: crypto.randomUUID(),
          email: adminEmail,
          passwordHash: hash,
          name: "Administrator",
          role: "admin"
        });
        console.log("\u2705 Admin created successfully!");
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}`);
      } else if (existingAdmin.role !== "admin") {
        console.log("\u{1F511} Upgrading existing user to admin...");
        await db.update(users).set({ role: "admin" }).where(eq3(users.id, existingAdmin.id));
        console.log("\u2705 User upgraded to admin");
      } else {
        console.log("\u2139\uFE0F Admin account already exists and is active.");
      }
    } catch (err) {
      console.warn("\u26A0\uFE0F Admin check skipped (tables may be pending migration):", err.message);
    }
  } catch (err) {
    console.error("\u26A0\uFE0F Initialization failed:", err);
  }
}
ensureDbInitialized().catch(console.error);
var app = new Hono3();
app.use("*", cors({
  origin: (origin) => {
    if (!origin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      return origin || "*";
    }
    if (origin.endsWith(".vercel.app") || origin === clientOrigin) {
      return origin;
    }
    return clientOrigin;
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-User-Id", "X-Client-Timezone", "X-Client-City"]
}));
app.use("*", async (c, next) => {
  await ensureDbInitialized();
  await next();
});
var userActivityThrottle = /* @__PURE__ */ new Map();
app.use("*", async (c, next) => {
  await next();
  const userId = c.req.header("X-User-Id");
  if (userId && !c.req.path.startsWith("/api/admin")) {
    const lastTracked = userActivityThrottle.get(userId) || 0;
    const nowMs = Date.now();
    if (nowMs - lastTracked > 12e4) {
      userActivityThrottle.set(userId, nowMs);
      const ip = extractClientIp(c);
      resolveClientCity(c, ip).then(async (city) => {
        try {
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          await db.update(users).set({
            lastLogin: nowIso,
            lastIp: ip,
            lastCity: city
          }).where(eq3(users.id, userId));
          await db.insert(activityLogs).values({
            id: crypto.randomUUID(),
            userId,
            action: "active",
            ipAddress: ip,
            city,
            createdAt: nowIso
          });
        } catch {
        }
      }).catch(() => {
      });
    }
  }
});
app.route("/api/auth", auth_default);
app.route("/api", auth_default);
app.route("/api/admin", admin_default);
app.get("/api/health", (c) => c.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() }));
app.get("/", (c) => c.json({ status: "ok", service: "Goal Tracker API" }));
var app_default = app;

// server/src/serverless.ts
var serverless_default = getRequestListener(app_default.fetch);
export {
  serverless_default as default
};
