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
    await utils.redisk.save(users[4]);
});

describe('Search', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.search(
            User, 
            {
                key: 'name',
                value: 'j'
            },
            3
        )).sort((a, b) => a.id.localeCompare(b.id))).toEqual([users[0], users[3], users[2]].sort((a, b) => a.id.localeCompare(b.id)));
    });
});
