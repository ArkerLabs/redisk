import { RediskTestUtils } from './redisk-test-utils';
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
})

describe('Get one by existing ID', () => {
    it('should return persisted entity', async () => {
        expect(await utils.redisk.getOne(User, users[1].id)).toEqual(users[1]);
    });
});

describe('Get one by non-existent ID', () => {
    it('should return null', async () => {
        expect(await utils.redisk.getOne(User, 'foo')).toBeNull();
    });
});

describe('Get one by existing unique key', () => {
    it('should return persisted entity', async () => {
        expect(await utils.redisk.getOne(User, users[2].email, 'email')).toEqual(users[2]);
    });
});

describe('Get one by non-existent unique key', () => {
    it('should return null', async () => {
        expect(await utils.redisk.getOne(User, 'foo@bar.com', 'email')).toBeNull();
    });
});

describe('Get one by a key that is not unique', () => {
    it('should throw error', async () => {
        expect(utils.redisk.getOne(User, users[2].name, 'name')).rejects.toEqual(new Error('name is not an unique field!'));
    });
});