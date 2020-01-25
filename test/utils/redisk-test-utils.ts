import { Redisk } from '../../src/redisk';
import * as redis from 'redis';
import { Metadata } from '../../src/metadata/metadata';

export class RediskTestUtils {

    private redisURL = 'redis://127.0.0.1:6379/12';

    public connection;
    public redisk: Redisk;


    async beforeAll() {
        this.connection = redis.createClient({url: this.redisURL});
        this.redisk = new Redisk(new Metadata(), this.connection);
    }

    async afterEach() {
        await this.connection.flushdbAsync();
    }

    async afterAll() {
        await this.connection.end(false);
    }
}