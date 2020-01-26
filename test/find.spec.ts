import { RediskTestUtils } from './utils/redisk-test-utils';
import { users } from './fixtures/users';
import { User } from './models/user.model';
import { groups } from './fixtures/groups';
 
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


describe('Find with one condition', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.find(
            User,
            [
                {
                    key: 'color',
                    value: 'red',
                }
            ],
        )).sort()).toEqual([users[0], users[4]].sort());
    });
});

describe('Find with relation index', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.find(
            User,
            [
                {
                    key: 'group',
                    value: groups[0].id,
                }
            ],
        )).sort()).toEqual([users[0], users[1]].sort());
    });
});

describe('Find with one condition with limit and offset', () => {
    it('should return filtered persisted entities', async () => {
        expect(await utils.redisk.find(
            User,
            [
                {
                    key: 'color',
                    value: 'blue',
                }
            ],
            1, 
            2,
        )).toEqual([users[2]]);
    });
});

describe('Find with two AND condition', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.find(
            User,
            [
                {
                    key: 'color',
                    value: 'blue',
                },
                {
                    key: 'food',
                    value: 'tofu',
                },
            ],
        )).sort()).toEqual([users[3], users[2]]);
    });
});

describe('Find with two OR condition', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.find(
            User,
            [
                {
                    key: 'color',
                    value: 'red',
                },
                {
                    key: 'food',
                    value: 'avocado',
                },
            ],
            undefined,
            undefined,
            'OR',
        )).sort()).toEqual([users[0], users[1], users[4]]);
    });
});