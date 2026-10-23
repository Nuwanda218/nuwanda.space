import type { APIRoute } from 'astro';
import { randomUUID } from 'node:crypto';

export const prerender = false;
// 仅检查运行时；数据库状态由本地 CLI 单独检查，不公开凭证或连接信息。
export const GET: APIRoute = () => Response.json(
  { status: 'ok', mode: 'server', requestId: randomUUID() },
  { headers: { 'Cache-Control': 'no-store' } },
);
