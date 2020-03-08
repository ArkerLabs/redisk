import { Client } from './client';
import * as redis from 'redis';
import * as bluebird from 'bluebird';
import { ClientOptions } from './client.options';

export class RedisClient implements Client {

    private readonly client: redis.RedisClient;

    constructor(options: ClientOptions) {
        this.client = redis.createClient(options);
        bluebird.promisifyAll(redis);
    }

    async closeConnection(): Promise<void> {
        await this.client.end(false);
    }

    async flushdb(): Promise<void> {
        await this.client.flushdbAsync();
    }

    async hgetall(key: string): Promise<any[]> {
        return await this.client.hgetallAsync(key);
    }

    async smembers(key: string): Promise<any[]> {
        return await this.client.smembersAsync(key);
    }

    async hdel(key: string, field: string): Promise<void> {
        await this.client.hdelAsync(key, field);
    }

    async srem(key: string, member: string): Promise<void> {
        await this.client.sremAsync(key, member);
    }

    async zrem(key: string, member: string): Promise<void> {
        await this.client.zremAsync(key, member);
    }

    async set(key: string, value: string): Promise<void> {
        await this.client.setAsync(key, value);
    }

    async zadd(key: string, score: string, member: string): Promise<void> {
        await this.client.zaddAsync(key, score, member);
    }

    async sadd(key: string, member: string): Promise<void> {
        await this.client.saddAsync(key, member);
    }
    
    async hmset(key: string, values: any[]): Promise<void> {
        await this.client.hmsetAsync(key, values);
    }

    async rpush(key: string, element: string): Promise<void> {
        await this.client.rpushAsync(key, element);
    }

    async llen(key: string): Promise<number> {
        return await this.client.llenAsync(key);
    }

    async sscan(key: string, cursor: number, pattern: string): Promise<{cursor: number, data: any[]}> {
        const response = await this.client.sscanAsync(key, cursor, 'MATCH', pattern);

        return {
            cursor: Number(response[0]),
            data: response[1],
        }
    }

    async sinter(keys: string[]): Promise<string[]> {
        return await this.client.sinterAsync(keys);
    }

    async sunion(keys: string[]): Promise<string[]> {
        return await this.client.sunionAsync(keys);
    }

    async zrange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.client.zrangeAsync(key, start, stop);
    }

    async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.client.zrevrangeAsync(key, start, stop);
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        return await this.client.lrangeAsync(key, start, stop);
    }

    async lrem(key: string, count: number, element: string): Promise<void> {
        await this.client.lremAsync(key, count, element);
    }

    async del(key: string): Promise<void> {
        await this.client.delAsync(key);
    }

    async get(key: string): Promise<string> {
        return await this.client.getAsync(key);
    }

    async hmget(key: string, properties: string[]): Promise<string[]> {
        return await this.client.hmgetAsync(key, properties);
    }
}