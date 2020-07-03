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
});

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


describe('Get one with a default value', () => {
    it('should return the setted default value if is undefined', async () => {
        const id = '::defaultvalueid::';
        const created = new Date();
        const user = new User(id, 'Enver', null, 'enver@me.com', null, null, null, created);
        await utils.redisk.save(user);
        expect((await utils.redisk.getOne(User, id)).description).toEqual('Empty');
    });
});


describe('Get one by a key that is not unique', () => {
    it('should throw error', async () => {
        expect(utils.redisk.getOne(User, users[2].name, 'name')).rejects.toEqual(new Error('name is not an unique field!'));
    });
});