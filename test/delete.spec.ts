import { RediskTestUtils } from './utils/redisk-test-utils';
import { users } from './fixtures/users';
import { User } from './entities/user.entity';
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
});

describe('Delete', () => {
    it('should remove persisted entity', async () => {
        await utils.redisk.delete(User, users[0].id);
        expect(await utils.redisk.getClient().hgetall('user:' + users[0].id)).toBeNull();

        expect(await utils.redisk.getClient().get('user:unique:email:' + users[0].email)).toBeNull();

        expect(await utils.redisk.getClient().lrange('user:list', 0, -1)).toEqual([ users[1].id, users[2].id ]);

        expect(await utils.redisk.getClient().zrange('user:index:color:' + users[0].color, 0, -1)).toEqual([]);
        expect(await utils.redisk.getClient().zrange('user:index:food:' + users[0].food, 0, -1)).toEqual([ users[2].id ]);
        expect(await utils.redisk.getClient().zrange('user:index:group:' + groups[0].id, 0, -1)).toEqual([ users[1].id ]);

        expect(await utils.redisk.getClient().zrange('user:index:created', 0, -1)).toEqual([ users[1].id, users[2].id ]);

        expect((await utils.redisk.getClient().smembers('user:search:name')).sort((a, b) => a.localeCompare(b))).toEqual(
            [ users[2].id + ':_id_:' + users[2].name.toLowerCase(), users[1].id + ':_id_:' + users[1].name.toLowerCase() ].sort((a, b) => a.localeCompare(b))
        );
    });
});