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

describe('List without params', () => {
    it('should return all persisted entities', async () => {
        expect((await utils.redisk.list(User))).toEqual(users);
    });
});


describe('List with limit and offset', () => {
    it('should return persisted entities', async () => {
        const limit = 2;
        const offset = 1;
        expect((await utils.redisk.list(User, undefined, limit, offset)).sort()).toEqual([users[1], users[2]].sort());
    });
});

describe('List with order by asc', () => {
    it('should return persisted entities sorted', async () => {
        const response = await utils.redisk.list(User, undefined, undefined, undefined, { field: 'created', strategy: 'ASC' });
        expect(response).toEqual(users);
    });
});

describe('List with order by asc and limit and offset', () => {
    it('should return persisted entities sorted', async () => {
        const response = await utils.redisk.list(User, undefined, 2, 1, { field: 'created', strategy: 'ASC' });
        expect(response).toEqual([users[1], users[2]]);
    });
});

describe('List with order by desc', () => {
    it('should return persisted entities sorted', async () => {
        const response = await utils.redisk.list(User, undefined, undefined, undefined, { field: 'created', strategy: 'DESC' });
        expect(response).toEqual([users[4], users[3], users[2], users[1], users[0]]);
    });
});



describe('List with one condition', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'color',
                        value: 'red',
                        comparator: '=',
                    },
                ],
                type: 'AND',
            },
        ))).toEqual([users[0], users[4]]);
    });
});

describe('List with relation index', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'group',
                        value: groups[0].id,
                        comparator: '=',
                    }
                ],
                type: 'AND',
            },
        ))).toEqual([users[0], users[1]]);
    });
});
describe('List with one condition with limit and offset', () => {
    it('should return filtered persisted entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'color',
                        value: 'blue',
                        comparator: '=',
                    }
                ],
                type: 'AND',
            },
            1, 
            2,
        )).toEqual([users[1]]);
    });
});

describe('List with two AND condition and order by', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'color',
                        value: 'blue',
                        comparator: '=',
                    },
                    {
                        key: 'food',
                        value: 'tofu',
                        comparator: '=',
                    },
                ],
                type: 'AND'
            },
            undefined,
            undefined,
            {
                field: 'created',
                strategy: 'DESC',
            },
        ))).toEqual([users[3], users[2]]);
    });
});

describe('List with two AND condition', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'color',
                        value: 'blue',
                        comparator: '=',
                    },
                    {
                        key: 'food',
                        value: 'tofu',
                        comparator: '=',
                    },
                ],
                type: 'AND'
            },
        ))).toEqual([users[2], users[3]]);
    });
});

describe('List with two OR condition', () => {
    it('should return filtered persisted entities', async () => {
        expect((await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'color',
                        value: 'red',
                        comparator: '=',
                    },
                    {
                        key: 'food',
                        value: 'avocado',
                        comparator: '='
                    },
                ],
                type: 'OR',
            },
        ))).toEqual([users[4], users[0], users[1]]);
    });
});

describe('List with greater than condition', () => {
    it('should return filteres entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'created',
                        value: new Date('2020-02-23 20:35:00'),
                        comparator: '>'
                    },
                ],
                type: 'AND'
            }
        )).toEqual([users[3], users[4]]);
    });
});
describe('List with greater than and equal condition', () => {
    it('should return filteres entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'created',
                        value: new Date('2020-02-23 20:35:00'),
                        comparator: '>'
                    },
                    {
                        key: 'color',
                        value: 'blue',
                        comparator: '='
                    },
                ],
                type: 'AND'
            }
        )).toEqual([users[3]]);
    });
});

describe('List with greater than condition with limit and offset', () => {
    it('should return filteres entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'created',
                        value: new Date('2020-02-23 20:35:00'),
                        comparator: '>'
                    },
                ],
                type: 'AND'
            },
            1,
            1,
        )).toEqual([users[4]]);
    });
});

describe('List with less than condition', () => {
    it('should return filteres entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'created',
                        value: new Date('2020-02-22 10:34:00'),
                        comparator: '<'
                    },
                ],
                type: 'AND'
            }
        )).toEqual([users[0]]);
    });
});

describe('List with less than and greater than condition', () => {
    it('should return filteres entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'created',
                        value: new Date('2020-02-22 10:34:00'),
                        comparator: '>'
                    },
                    {
                        key: 'created',
                        value: new Date('2020-02-22 13:10:00'),
                        comparator: '<'
                    },
                ],
                type: 'AND'
            }
        )).toEqual([users[1]]);
    });
});

describe('List with order by and condition', () => {
    it('should return filteres entities', async () => {
        expect(await utils.redisk.list(
            User,
            {
                conditions: [
                    {
                        key: 'food',
                        value: 'tofu',
                        comparator: '='
                    },
                ],
                type: 'AND'
            },
            1,
            0,
            {
                field: 'created',
                strategy: 'DESC'
            },
        )).toEqual([users[3]]);
    });
});