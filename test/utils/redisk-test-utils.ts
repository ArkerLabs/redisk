import { Redisk } from '../../src/redisk';
import * as redis from 'redis';
import { Metadata } from '../../src/metadata/metadata';

export class RediskTestUtils {

    private redisURL = 'redis://127.0.0.1:6379/12';

    public redisk: Redisk;


    async beforeAll() {
        this.redisk = Redisk.init({url: this.redisURL});
    }

    async afterEach() {
        await this.redisk.getClient().flushdb();
    }

    async afterAll() {
        await this.redisk.close();
    }
}