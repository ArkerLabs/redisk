<h1 align="center">
  <img src="https://raw.githubusercontent.com/arkerlabs/redisk/master/docs/images/logo.png" alt="Redisk">
</h1>

[![npm version](https://badge.fury.io/js/redisk.svg)](https://badge.fury.io/js/redisk)

Redisk is a TypeScript ORM library for Redis.


## Features:

* Store entities.
* Single relation support.
* Unique keys support.
* Retrieve entities by his primary keys or his unique keys.
* Indexes support.
* List entities with common filters, like limit, count and sort by.
* Find entities with multiple conditions ('>', '<', '=', '!=').
* Search (Similar to LIKE in SQL)
* And much more.


## Quick overview
```ts
const redisk = Redisk.init({url: 'redis://127.0.0.1:6379/0'});

@Entity('user')
export class User {

  @Primary()
  @Property()
  public readonly id: string;

  @Property()
  public name: string;

  constructor(
      id: string,
      name: string,
    ) {
      this.id = id;
      this.name = name;
  }
}

await redisk.save(new User('::id::', 'Foo'));

console.log(await redisk.getOne(User, '::id::'));

```


## Installation
```bash
npm install redisk --save
```

## Contents

- [Connection](#connection)
  - [Options](#options)
- [Models](#models)
  - [Model definition](#model-definition)
  - [Entity](#entity)
  - [Property](#property)
    - [Supported types](#supported-types)
  - [Primary](#primary)
  - [Unique](#unique)
  - [Embedding other entities](#embedding-other-entities)
- [Queries](#queries)
  - [Save](#save)
  - [Update](#update)
  - [Get by primary key](#get-by-primary-key)
  - [Get by unique key](#get-by-unique-key)
  - [Count](#count)
  - [List all](#list-all)
  - [List all with conditions](#find-all-by-index)
    - [Simple](#simple)
    - [Multiple conditions](#multiple-conditions)
  - [Pattern matching](#pattern-matching)
  - [Delete](#delete)


## Connection

```ts
const redisk = Redisk.init(options);
```

### Options
| Property | Description                                                                                                                             |
|----------|-----------------------------------------------------------------------------------------------------------------------------------------|
| url      | URL of the Redis server. Format [redis[s]:]//[[user][:password@]][host][:port][/db-number][?db=db-number[&password=bar[&option=value]]] |
| host     | Host of the Redis server                                                                                                                |
| port     | Port of the Redis server                                                                                                                |
| db       | Number of the db (Default: 0)                                                                                                           |
| password | Password of the Redis server     


Closing connection to Redis:

```ts
await redisk.close();
```

## Models

### Model definition
```ts
@Entity('user')
export class User {

  @Primary()
  @Property()
  public readonly id: string;

  @Property({searchable: true})
  public name: string;

  @Unique()
  @Property()
  public email: string;

  @Property({indexed: true})
  public color: string;

  @HasOne(Group, {cascadeInsert: true, cascadeUpdate: true})
  @Property()
  public group: Group;

  @Property({indexed: true})
  public created: Date;

  constructor(
      id: string,
      name: string,
      email: string,
      color: string,
      group: Group,
      created: Date,
    ) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.color = color;
      this.group = group;
      this.created = created;
  }
}
```

### Entity
Use the decorator `Entity` to convert your class into a Redisk entity.

You can pass the option canBeListed to 'false' (Default is true) to save some space, but you will not be able to list user entities. 

```ts
@Entity('user', { canBeListed: true })
export class User {
}
```

### Property
The decorator `Property` is used to save the fields into redis.

Optionally, you can pass the options `indexed` if you want to use the field to sort or to use as a condition in the 'list' method or `searchable` if you want to use pattern matching in this field.

Both options are false by default.

```ts
@Entity('user')
export class User {

    @Property({indexed: true, searchable: false})
    public readonly created: Date;

}
```

#### Supported types
Redisk support multiple types to store and query. 
- String
- Date (Will be saved as a timestamp)
- Boolean
- Number

All other types will be converted to a string.

### Primary
`Primary` decorator is used to define the primary key of the entity. It can only be one primary key and his value must be unique for all the same entities.
```ts
@Entity('user')
export class User {

  @Primary()
  @Property()
  public readonly id: string;
}
```

### Unique
This decorator is used to make the value of this field unique for all the same entities. 
Then you can use it to query the entity.
```ts
@Entity('user')
export class User {

  @Unique()
  @Property()
  public readonly email: string;
}
```

### Embedding other entities
You can make one to one relations with the `HasOne` decorator.

Cascade inserts and updates are supported. (These options are false by default)

```ts
@Entity('user')
export class User {

  @HasOne(Group, {cascadeInsert: true, cascadeUpdate: true})
  @Property()
  public readonly group: Group;
}
```

## Queries

### Save

```ts
await redisk.save(new User(id, name));
```

### Update

```ts
const user = await redisk.getOne(User, id);
user.name = 'Bar';
await redisk.save(user);
```

### Get by primary key

```ts
await redisk.getOne(User, id);
```

### Get by unique key 

```ts
const value = 'john@doe.com';
const uniqueKeyName = 'email';
await redisk.getOne(User, value, uniqueKeyName);
```

### Count

```ts
await redisk.count(User);
```

### List all
Returns an array of all user entities.
```ts
await redisk.list(User); 
```

Returns the first 10 user entities
```ts
const limit = 10;
const offset = 0;
await redis.list(User, limit, offset);
```

Return an array of user entities sorted by his creation date in descending order
```ts
await redisk.list(User, undefined, undefined, undefined, {
    field: 'created',
    strategy: 'DESC',
});
```

### List all with conditions
#### Simple
Returns an array of users where his color is red

```ts
const where = 
    conditions: [
        {
            key: 'color',
            value: 'red',
            comparator: '=',
        },
    ],
    type: 'AND',
};
await redisk.find(User, where, limit, offset); 
```

Returns an array of users where his creation date is greater than the day 23
```ts
const where = 
    conditions: [
        {
            key: 'created',
            value: new Date('2020-02-23 00:00:00'),
            comparator: '>',
        },
    ],
    type: 'AND',
};
await redisk.find(User, where, limit, offset); 
```

#### Multiple conditions
Returns an array of entities that his color field is 'red' or 'blue'.

Warning: Using multiple conditions leads to multiple queries with table intersections, to achieve high performance queries try to reduce the results with more concise conditional.

```ts
const where = 
    conditions: [
        {
            key: 'color',
            value: 'red',
            comparator: '=',
        },
        {
            key: 'color',
            value: 'blue',
            comparator: '=',
        },
    ],
    type: 'OR',
};
await redisk.find(User, where, limit, offset);
```

Returns an array of entities that his color field is 'red' and his food field is 'avocado'
```ts
const where = 
    conditions: [
        {
            key: 'color',
            value: 'red',
            comparator: '=',
        },
        {
            key: 'color',
            value: 'blue',
            comparator: '=',
        },
    ],
    type: 'AND',
};
await redisk.find(User, where, limit, offset);
```

### Pattern matching

You can search entities by properties marked as searchables.

```ts
const condition = {
    key: 'name',
    value: 'John',
};
const maxNumberOfResults = 10;
await redisk.search(User, condition, maxNumberOfResults);
```

### Delete

```ts
await redisk.delete(User, id);
```