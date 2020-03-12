export interface Client {
    closeConnection(): Promise<void>;
    flushdb(): Promise<void>;
    hgetall(key: string): Promise<any[]>;
    smembers(key: string): Promise<any[]>;
    hdel(key: string, field: string): Promise<void>;
    srem(key: string, member: string): Promise<void>;
    zrem(key: string, member: string): Promise<void>;
    set(key: string, value: string): Promise<void>;
    zadd(key: string, score: string, member: string): Promise<void>;
    sadd(key: string, member: string): Promise<void>;
    hmset(key: string, values: any[]): Promise<void>;
    rpush(key: string, element: string): Promise<void>;
    llen(key: string): Promise<number>;
    sscan(key: string, cursor: number, pattern: string): Promise<{cursor: number, data: any[]}>;
    sinter(keys: string[] | string): Promise<string[]>;
    sunion(keys: string[]): Promise<string[]>;
    zrange(key: string, start: number, stop: number): Promise<string[]>;
    zrangebyscore(key: string, min: string, max: string, offset: number, count: number): Promise<string[]>;
    zrevrange(key: string, start: number, stop: number): Promise<string[]>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    lrem(key: string, count: number, element: string): Promise<void>;
    del(key: string): Promise<void>;
    get(key: string): Promise<string>;
    hmget(key: string, properties: string[]): Promise<string[]>;
    eval(...args: any[]): Promise<any[]>;
}