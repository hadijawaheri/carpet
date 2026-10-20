import type { ThrottlerStorage } from "@nestjs/throttler";
import type { Redis } from "ioredis";

/**
 * Fixed window per key, like the in-memory storage: the first hit starts a `ttl` window; going over
 * `limit` blocks the key for `blockDuration`. One script keeps the read-increment-block atomic across
 * every API process.
 */
const INCREMENT = `
local hits_key, block_key = KEYS[1], KEYS[2]
local ttl, limit, block = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])

local block_left = redis.call('PTTL', block_key)
if block_left > 0 then
  local hits = tonumber(redis.call('GET', hits_key) or '0')
  return { hits, math.max(redis.call('PTTL', hits_key), 0), 1, block_left }
end

local hits = redis.call('INCR', hits_key)
if hits == 1 then redis.call('PEXPIRE', hits_key, ttl) end
local ttl_left = redis.call('PTTL', hits_key)

if hits > limit and block > 0 then
  redis.call('SET', block_key, '1', 'PX', block)
  return { hits, ttl_left, 1, block }
end
return { hits, ttl_left, hits > limit and 1 or 0, 0 }
`;

const seconds = (ms: number) => Math.ceil(ms / 1000);

export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(
    private readonly redis: Redis,
    private readonly prefix = "farsh:throttle",
  ) {}

  async increment(key: string, ttl: number, limit: number, blockDuration: number, name: string) {
    const base = `${this.prefix}:${name}:${key}`;
    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] = (await this.redis.eval(
      INCREMENT,
      2,
      `${base}:hits`,
      `${base}:block`,
      ttl,
      limit,
      blockDuration,
    )) as [number, number, number, number];
    return {
      totalHits,
      timeToExpire: seconds(timeToExpire),
      isBlocked: isBlocked === 1,
      timeToBlockExpire: seconds(timeToBlockExpire),
    };
  }
}
