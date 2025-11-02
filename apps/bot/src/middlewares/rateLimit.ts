import { Context } from 'telegraf';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<number, RateLimitEntry>();

export function rateLimit(maxCalls: number, windowMs: number) {
  return async (ctx: Context, next: () => Promise<void>) => {
    const userId = ctx.from?.id;
    if (!userId) {
      return;
    }

    const now = Date.now();
    const entry = rateLimits.get(userId);

    if (!entry || entry.resetAt < now) {
      rateLimits.set(userId, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (entry.count >= maxCalls) {
      await ctx.reply(
        '⏳ Too many requests. Please wait a moment.',
        { reply_to_message_id: ctx.message?.message_id }
      );
      return;
    }

    entry.count++;
    return next();
  };
}

