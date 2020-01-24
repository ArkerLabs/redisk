Redisk
=====
[![npm version](https://badge.fury.io/js/redisk.svg)](https://badge.fury.io/js/redisk)

Redisk is a TypeScript ORM library for Redis.


## Features:

* Store entities.
* Single relation support.
* Unique keys support.
* Retrieve entities by his primary keys or his unique keys.
* Indexes support.
* List entities with common filters, like limit, count and sort by.
* Find entities with multiple conditions.
* Search (Similar to LIKE in SQL)
* And much more.


## Getting started
```bash
npm install redisk --save
```
## Examples with a User model

### Model definition
```ts
@Entity('user', { canBeListed: true })
export class User {

  @Primary()
  @Property()
  public readonly id: string;

  @Property({sortable: false, searchable: true})
  public readonly name: string;

  @Unique()
  @Property()
  public readonly email: string;

  @Index()
  @Property()
  public readonly color: string;

  @Property({sortable: true, searchable: false})
  public readonly created: Date;

  constructor(
      id: string,
      name: string,
      email: string,
      color: string,
      created: Date,
    ) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.color = color;
      this.created = created;
  }
}
```

### Init Redisk

```ts
const redisk = new Redisk(new Metadata(), 'redis://127.0.0.1:6379/0');
```

### Store one user

```ts
await redisk.commit<User>(new User(id, name, email, color, created));
```

### Get one user by his primary key

```ts
await redisk.getOne<User>(User, id);
```

### Get one user by his email unique key 

```ts
await redisk.getOne<User>(User, 'john@doe.com', 'email');
```

### Count all users

```ts
await redisk.count<User>(User);
```

### List all users

```ts
await redisk.list<User>(User); // Returns an array of entities

const limit = 10;
const offset = 0;
await redis.list<User>(User, limit, offset); // Returns 10 user entities

await redisk.list<User>(User, undefined, undefined, {
    field: 'created',
    strategy: 'DESC',
}); // Returns an array of entities sorted by his creation date in descending order
```

### Find all users by one index
```ts
const conditions = [
    {
        key: 'color',
        value: 'red',
    },
];
await redisk.find<User>(User, conditions, limit, offset); // Returns an array of entites that match the conditions
```

### Search users by his name

```ts
const condition = {
    key: 'name',
    value: 'John',
};
const maxNumberOfResults = 10;
await redisk.search<User>(User, condition, maxNumberOfResults);
```

### Delete one user

```ts
await redisk.delete<User>(User, id);
```