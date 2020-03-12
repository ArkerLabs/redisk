import { RediskTestUtils } from './utils/redisk-test-utils';
import { users } from './fixtures/users';
import { User } from './entities/user.entity';

let utils: RediskTestUtils;  

beforeAll(async () => {
    utils = new RediskTestUtils();
    await utils.beforeAll();
});

afterEach(async () => {
    await utils.afterEach();
});

afterAll(async () => {
    await utils.afterAll();
});

beforeEach(async () => {
    await utils.redisk.save(users[0]);
    await utils.redisk.save(users[1]);
    await utils.redisk.save(users[2]);
    await utils.redisk.save(users[3]);
});

describe('Count', () => {
    it('should return number of persisted entities', async () => {
        expect(await utils.redisk.count(User)).toEqual(4);
    });
});
