import { RediskTestUtils } from './utils/redisk-test-utils';
import { users } from './fixtures/users';
import { User } from './models/user.model';

let utils; 

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
    await utils.redisk.commit(users[0]);
    await utils.redisk.commit(users[1]);
    await utils.redisk.commit(users[2]);
    await utils.redisk.commit(users[3]);
    await utils.redisk.commit(users[4]);
});

describe('Search', () => {
    it('should return filtered persisted entities', async () => {
        expect(await utils.redisk.search(
            User, 
            {
                key: 'name',
                value: 'j'
            },
            2
        )).toEqual([users[3], users[2]]);
    });
});
