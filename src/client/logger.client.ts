import { Client } from './client';
import logger from '../logger/logger';

export class LoggerClient implements Client {


    constructor(private readonly client: Client) {}

    async closeConnection(): Promise<void> {
        logger.info('Closing connection...');
        await this.client.closeConnection();
        logger.info('Connection closed');
    }

    async flushdb(): Promise<void> {
        logger.info('Flushing db...');
        await this.client.flushdb();
        logger.info('Db flushed');
    }

    async hgetall(key: string): Promise<any[]> {
        logger.info('HGETALL ' + key);
        const response = await this.client.hgetall(key);
        logger.info(response);
        return response;
    }

    async smembers(key: string): Promise<any[]> {
        logger.info('SMEMBERS ' + key);
        const response = await this.client.smembers(key);
        logger.info(response);
        return response;
    }

    async hdel(key: string, field: string): Promise<void> {
        logger.info('HDEL ' + key + ' ' + field);
        await this.client.hdel(key, field);
    }

    async srem(key: string, member: string): Promise<void> {
        logger.info('SREM ' + key + ' ' + member);
        await this.client.srem(key, member);
    }

    async zrem(key: string, member: string): Promise<void> {
        logger.info('ZREM ' + key + ' ' + member);
        await this.client.zrem(key, member);
    }

    async set(key: string, value: string): Promise<void> {
        logger.info('SET ' + key + ' ' + value);
        await this.client.set(key, value);
    }

    async zadd(key: string, score: string, member: string): Promise<void> {
        logger.info('ZADD ' + key + ' ' +score + ' ' + member);
        await this.client.zadd(key, score, member);
    }

    async sadd(key: string, member: string): Promise<void> {
        logger.info('SADD ' + key + ' ' + member);
        await this.client.sadd(key, member);
    }
    
    async hmset(key: string, values: any[]): Promise<void> {
        logger.info('HMSET ' + key + ' ' + JSON.stringify(values));
        await this.client.hmset(key, values);
    }

    async rpush(key: string, element: string): Promise<void> {
        logger.info('RPUSH ' + key + ' ' + element);
        await this.client.rpush(key, element);
    }

    async llen(key: string): Promise<number> {
        logger.info('LLEN ' + key);
        const response = await this.client.llen(key);
        logger.info('LLEN RESPONSE = ' + response);
        return response;
    }

    async sscan(key: string, cursor: number, pattern: string): Promise<{cursor: number, data: any[]}> {
        logger.info('SSCAN', key, cursor, 'MATCH', pattern);
        const response = await this.client.sscan(key, cursor, pattern);
        logger.info(response);
        return response;
    }

    async sinter(keys: string[]): Promise<string[]> {
        logger.info('SINTER ' + JSON.stringify(keys));
        const response = await this.client.sinter(keys);
        logger.info(response);
        return response;
    }

    async sunion(keys: string[]): Promise<string[]> {
        logger.info('SUNION ' + JSON.stringify(keys));
        const response = await this.client.sunion(keys);
        logger.info(response);
        return response;
    }

    async zrangebyscore(key: string, min: string, max: string, offset: number, count: number): Promise<string[]> {
        logger.info('ZRANGEBYSCORE', key, min, max, 'LIMIT', offset, count);
        const response = await this.client.zrangebyscore(key, min, max, offset, count);
        logger.info(response);
        return response;
    }

    async zrange(key: string, start: number, stop: number): Promise<string[]> {
        logger.info('ZRANGE ' + key + ' ' + start + ' ' + stop);
        const response = await this.client.zrange(key, start, stop);
        logger.info(response);
        return response;
    }

    async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
        logger.info('ZREVRANGE ' + key + ' ' + start + ' ' + stop);
        const response = await this.client.zrevrange(key, start, stop);
        logger.info(response);
        return response;
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        logger.info('LRANGE ' + key + ' ' + start + ' ' + stop);
        const response = await this.client.lrange(key, start, stop);
        logger.info(response);
        return response;
    }

    async lrem(key: string, count: number, element: string): Promise<void> {
        logger.info('LREM ' + key + ' ' + count + ' ' + element);
        await this.client.lrem(key, count, element);
    }

    async del(key: string): Promise<void> {
        logger.info('DEL ' + key);
        await this.client.del(key);
    }

    async get(key: string): Promise<string> {
        logger.info('GET ' + key);
        return await this.client.get(key);
    }

    async hmget(key: string, properties: string[]): Promise<string[]> {
        logger.info('HMGET ' + key + ' ' + JSON.stringify(properties));
        const response = await this.client.hmget(key, properties);
        logger.info(response);
        return response;
    }

    async eval(...args: any[]): Promise<any[]> {
        logger.info('EVAL');
        const response = await this.client.eval(...args);
        logger.info(response);
        return response;
    }
}