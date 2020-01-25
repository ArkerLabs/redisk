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
});

const id = '__id__';
const name = 'Anna';
const email = 'anna@email.com';
const color = 'red';
const food = 'bread';
const created = new Date('2020-01-12 09:18:30');

describe('Save', () => {
    it('should persist entity', async () => {
        const user = new User(id, name, email, color, food, created);

        await utils.redisk.save(user);

        const storedUser = await utils.connection.hgetallAsync('user:' + id);
        expect(storedUser).toEqual({
            id,
            name,
            email,
            color,
            food,
            created: String(created.valueOf()),
        });

        expect(await utils.connection.getAsync('user:unique:email:' + email)).toEqual(id);

        expect(await utils.connection.lrangeAsync('user:list', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.connection.sinterAsync('user:index:color:' + color)).toEqual([ id, users[0].id ]);
        expect(await utils.connection.sinterAsync('user:index:food:' + food)).toEqual([ id ]);

        expect(await utils.connection.zrangeAsync('user:sort:created', 0, -1)).toEqual([ id, users[0].id ]);

        expect(await utils.connection.smembersAsync('user:search:name')).toEqual(
            [ id + ':_id_:' + name.toLowerCase(), users[0].id + ':_id_:' + users[0].name.toLowerCase() ]
        );
    });
});

describe('Save with unique in-use', () => {
    it('should throw error', async () => {
        const user = new User(id, name, email, color, food, created);
        await utils.redisk.save(user);
        const user2 = new User('foo', name, email, color, food, created);
        let exception;
        try {
            await utils.redisk.save(user2);
        } catch (e) {
            exception = e;
        }
        expect(exception).toEqual(new Error('email is not unique!'));
    });
});

describe('Update persisted entity', () => {
    it('should update entity', async () => {
        const user = new User(id, name, email, color, food, created);
        await utils.redisk.save(user);

        const newName = 'Riley';
        const newEmail = 'riley@email.com';
        const newColor = 'purple';
        const newCreated = new Date('2020-03-25 12:10:04');
        const updatedUser = new User(id, newName, newEmail, newColor, food, newCreated);
        await utils.redisk.save(updatedUser);

        const storedUser = await utils.connection.hgetallAsync('user:' + id);
        expect(storedUser).toEqual({
            id,
            name: newName,
            email: newEmail,
            color: newColor,
            food,
            created: String(newCreated.valueOf()),
        });

        expect(await utils.connection.getAsync('user:unique:email:' + newEmail)).toEqual(id);

        expect(await utils.connection.lrangeAsync('user:list', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.connection.sinterAsync('user:index:color:' + color)).toEqual([ users[0].id ]);
        expect(await utils.connection.sinterAsync('user:index:color:' + newColor)).toEqual([ id ]);
        expect(await utils.connection.sinterAsync('user:index:food:' + food)).toEqual([ id ]);

        expect(await utils.connection.zrangeAsync('user:sort:created', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.connection.smembersAsync('user:search:name')).toEqual(
            [ id + ':_id_:' + newName.toLowerCase(), users[0].id + ':_id_:' + users[0].name.toLowerCase() ]
        );
    });
});