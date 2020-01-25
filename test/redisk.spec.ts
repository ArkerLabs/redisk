import { Redisk } from '../src/redisk';
import { Metadata } from '../src/metadata/metadata';
import * as redis from 'redis';

const redisURL = 'redis://127.0.0.1:6379/12';

let redisk;
let connection;

beforeAll(async () => {
    connection = redis.createClient({url: redisURL});
    redisk = new Redisk(new Metadata(), redisURL);
});

afterEach(async () => {
    await connection.flushdbAsync();
});

afterAll(async () => {
    await connection.end(true)
});

describe('Redisk', () => {
    it('should return true', () => {
        expect(true).toBe(true);
    });
});