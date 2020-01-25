import { RediskTestUtils } from './utils/redisk-test-utils';
import { users } from './fixtures/users';
import { User } from './models/user.model';

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

describe('List without params', () => {
    it('should return all persisted entities', async () => {
        expect((await utils.redisk.list(User)).sort()).toEqual(users.sort());
    });
});


describe('List with limit and offset', () => {
    it('should return persisted entities', async () => {
        const limit = 2;
        const offset = 1;
        expect((await utils.redisk.list(User, limit, offset)).sort()).toEqual([users[1], users[2]].sort());
    });
});

describe('List with order by asc', () => {
    it('should return persisted entities sorted', async () => {
        const response = await utils.redisk.list(User, undefined, undefined, { field: 'created', strategy: 'ASC' });
        expect(response).toEqual(users);
    });
});

describe('List with order by asc and limit and offset', () => {
    it('should return persisted entities sorted', async () => {
        const response = await utils.redisk.list(User, 2, 1, { field: 'created', strategy: 'ASC' });
        expect(response).toEqual([users[1], users[2]]);
    });
});

describe('List with order by desc', () => {
    it('should return persisted entities sorted', async () => {
        const response = await utils.redisk.list(User, undefined, undefined, { field: 'created', strategy: 'DESC' });
        expect(response).toEqual(users.reverse());
    });
});