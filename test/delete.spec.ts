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
});

describe('Delete', () => {
    it('should remove persisted entity', async () => {
        await utils.redisk.delete(User, users[0].id);
        expect(await utils.connection.hgetallAsync('user:' + users[0].id)).toBeNull();

        expect(await utils.connection.getAsync('user:unique:email:' + users[0].email)).toBeNull();

        expect(await utils.connection.lrangeAsync('user:list', 0, -1)).toEqual([ users[1].id, users[2].id ]);

        expect(await utils.connection.sinterAsync('user:index:color:' + users[0].color)).toEqual([]);
        expect(await utils.connection.sinterAsync('user:index:food:' + users[0].food)).toEqual([ users[2].id ]);

        expect(await utils.connection.zrangeAsync('user:sort:created', 0, -1)).toEqual([ users[1].id, users[2].id ]);

        expect(await utils.connection.smembersAsync('user:search:name')).toEqual(
            [ users[2].id + ':_id_:' + users[2].name.toLowerCase(), users[1].id + ':_id_:' + users[1].name.toLowerCase() ]
        );
    });
});