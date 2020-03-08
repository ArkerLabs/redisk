import { RediskTestUtils } from './utils/redisk-test-utils';
import { users } from './fixtures/users';
import { User } from './models/user.model';
import { Group } from './models/group.model';

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
const group = new Group('4E2F', 'Group name');

describe('Save with cascade insert', () => {
    it('should persist entity', async () => {
        const user = new User(id, name, email, color, food, group, created);

        await utils.redisk.save(user);

        const storedUser = await utils.redisk.getClient().hgetall('user:' + id);
        expect(storedUser).toEqual({
            id,
            name,
            email,
            color,
            food,
            group: group.id,
            created: String(created.valueOf()),
        });
        const storedGroup = await utils.redisk.getClient().hgetall('group:' + group.id);
        expect(storedGroup).toEqual({
            id: group.id,
            name: group.name,
        });

        expect(await utils.redisk.getClient().get('user:unique:email:' + email)).toEqual(id);

        expect(await utils.redisk.getClient().lrange('user:list', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.redisk.getClient().sinter('user:index:color:' + color)).toEqual([ users[0].id, id ]);
        expect(await utils.redisk.getClient().sinter('user:index:food:' + food)).toEqual([ id ]);

        expect(await utils.redisk.getClient().zrange('user:sort:created', 0, -1)).toEqual([ id, users[0].id ]);

        expect(await utils.redisk.getClient().smembers('user:search:name')).toEqual(
            [  users[0].id + ':_id_:' + users[0].name.toLowerCase(), id + ':_id_:' + name.toLowerCase() ]
        );
    });
});

describe('Save with unique in-use', () => {
    it('should throw error', async () => {
        const user = new User(id, name, email, color, food, null, created);
        await utils.redisk.save(user);
        const user2 = new User('foo', name, email, color, food, null, created);
        let exception;
        try {
            await utils.redisk.save(user2);
        } catch (e) {
            exception = e;
        }
        expect(exception).toEqual(new Error('email is not unique!'));
    });
});


describe('Update persisted entity with cascade update', () => {
    it('should update entities', async () => {
        const user = new User(id, name, email, color, food, group, created);
        await utils.redisk.save(user);

        const newName = 'Riley';
        const newEmail = 'riley@email.com';
        const newColor = 'purple';
        const newCreated = new Date('2020-03-25 12:10:04');

        const group2 = new Group(group.id, 'Foo');
        const updatedUser = new User(id, newName, newEmail, newColor, food, group2, newCreated);
        await utils.redisk.save(updatedUser);

        const storedUser = await utils.redisk.getClient().hgetall('user:' + id);
        expect(storedUser).toEqual({
            id,
            name: newName,
            email: newEmail,
            color: newColor,
            food,
            group: group.id,
            created: String(newCreated.valueOf()),
        });
        const storedGroup = await utils.redisk.getClient().hgetall('group:' + group.id);
        expect(storedGroup).toEqual({
            id: group.id,
            name: group2.name,
        });

        expect(await utils.redisk.getClient().get('user:unique:email:' + newEmail)).toEqual(id);
        expect(await utils.redisk.getClient().get('user:unique:email:' + email)).toBeNull();

        expect(await utils.redisk.getClient().lrange('user:list', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.redisk.getClient().sinter('user:index:color:' + color)).toEqual([ users[0].id ]);
        expect(await utils.redisk.getClient().sinter('user:index:color:' + newColor)).toEqual([ id ]);
        expect(await utils.redisk.getClient().sinter('user:index:food:' + food)).toEqual([ id ]);

        expect(await utils.redisk.getClient().zrange('user:sort:created', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.redisk.getClient().smembers('user:search:name')).toEqual(
            [ users[0].id + ':_id_:' + users[0].name.toLowerCase(), id + ':_id_:' + newName.toLowerCase() ]
        );
    });
});

describe('Update persisted entity', () => {
    it('should update entity', async () => {
        const user = new User(id, name, email, color, food, group, created);
        await utils.redisk.save(user);

        const newName = 'Riley';
        const newEmail = 'riley@email.com';
        const newColor = 'purple';
        const newCreated = new Date('2020-03-25 12:10:04');
        const updatedUser = new User(id, newName, newEmail, newColor, food, null, newCreated);
        await utils.redisk.save(updatedUser);

        const storedUser = await utils.redisk.getClient().hgetall('user:' + id);
        expect(storedUser).toEqual({
            id,
            name: newName,
            email: newEmail,
            color: newColor,
            food,
            created: String(newCreated.valueOf()),
        });

        expect(await utils.redisk.getClient().get('user:unique:email:' + newEmail)).toEqual(id);

        expect(await utils.redisk.getClient().lrange('user:list', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.redisk.getClient().sinter('user:index:color:' + color)).toEqual([ users[0].id ]);
        expect(await utils.redisk.getClient().sinter('user:index:color:' + newColor)).toEqual([ id ]);
        expect(await utils.redisk.getClient().sinter('user:index:food:' + food)).toEqual([ id ]);

        expect(await utils.redisk.getClient().zrange('user:sort:created', 0, -1)).toEqual([ users[0].id, id ]);

        expect(await utils.redisk.getClient().smembers('user:search:name')).toEqual(
            [ users[0].id + ':_id_:' + users[0].name.toLowerCase(), id + ':_id_:' + newName.toLowerCase() ]
        );
    });
});