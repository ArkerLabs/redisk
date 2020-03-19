import { Type } from './metadata/type';
import { Metadata } from './metadata/metadata';
import { PropertyMetadata } from './metadata/property.metadata';
import { Condition } from './interfaces/condition';
import { OrderBy } from './interfaces/orderby';
import { ClientOptions, Client, RedisClient } from './client';
import { WhereCondition } from './interfaces/where-condition';
import * as fs from 'fs';
import * as path from 'path';

export class Redisk {

    constructor(
        private readonly metadata: Metadata,
        private readonly client: Client,
    ) {
    }

    static init(options: ClientOptions) {
        return new Redisk(new Metadata(), new RedisClient(options));
    }

    async close() {
        await this.client.closeConnection();
    }

    getClient(): Client {
        return this.client;
    }

    async save<T>(entity: T): Promise<void> {

        const {name, uniques, primary, canBeListed, properties, hasOneRelations} = this.metadata.getEntityMetadataFromInstance(entity);

        const hashKey = name + ':' + entity[primary];

        const persistedEntity = await this.getOne<T>(entity.constructor as Type<T>, entity[primary]);
        if (persistedEntity !== null) {
            const changedFields = [];

            for (const property of Object.keys(properties).map(key => properties[key])) {
                if (entity[property.name] !== persistedEntity[property.name]) {
                    changedFields.push(property.name);

                    if (entity[property.name] === null) {
                        await this.client.hdel(hashKey, property.name);
                    }

                    if (hasOneRelations !== undefined && hasOneRelations[property.name] && hasOneRelations[property.name].cascadeUpdate && entity[property.name] !== null) {
                        await this.save(entity[property.name]);
                    }

                    if (property.searchable) {
                        await this.client.srem(
                            this.getSearchableKeyName(name, property.name),
                            this.getSearchableValuePrefix(entity[primary]) + persistedEntity[property.name].toLowerCase(),
                        );
                    }
                    
                    if (property.indexed) {
                        await this.dropIndex(persistedEntity, property, persistedEntity[primary]);
                    }
                }
            }

            if (uniques) {
                const uniquesChanged = changedFields.some(value => uniques.indexOf(value) >= 0);
                if (uniquesChanged) {
                    await this.dropUniqueKeys(persistedEntity);
                }
            }

        }

        if (uniques) {
            for (const uniqueName of uniques) {
                const entityWithUnique = await this.getOne<T>(entity.constructor as Type<T>, entity[uniqueName], uniqueName);
                if (entityWithUnique !== null && entityWithUnique[primary] !== entity[primary]) {
                    throw new Error(uniqueName + ' is not unique!');
                }
                if (entity[uniqueName] !== null) {
                    await this.client.set(
                        this.getUniqueKeyName(name, uniqueName) + ':' + entity[uniqueName],
                        entity[primary],
                    );
                }
            }
        }

        const valuesToStore = [];
        for (const property of Object.keys(properties).map(key => properties[key])) {
            if (entity[property.name] !== null) {

                let valueToStore = this.convertPropertyTypeToPrimitive(property, entity[property.name]);

                if (hasOneRelations !== undefined && hasOneRelations[property.name]) {
                    const relatedEntity = this.metadata.getEntityMetadataFromName(hasOneRelations[property.name].entityType().name);
                    valueToStore = entity[property.name][relatedEntity.primary];

                    if (hasOneRelations[property.name].cascadeInsert && persistedEntity === null && entity[property.name] !== null) {
                        await this.save(entity[property.name]);
                    }
                }

                valuesToStore.push(property.name);
                valuesToStore.push(valueToStore);
                
                if (property.searchable) {
                    await this.client.sadd(
                        this.getSearchableKeyName(name, property.name),
                        this.getSearchableValuePrefix(entity[primary]) + entity[property.name].toLowerCase(),
                    );
                }

                if (property.indexed) {
                    let value = entity[property.name];
                    if (hasOneRelations !== undefined && hasOneRelations[property.name] && entity[property.name] !== null) {
                        const relatedEntity = this.metadata.getEntityMetadataFromName(hasOneRelations[property.name].entityType().name);
                        value = entity[property.name][relatedEntity.primary];
                    }
                    if (value !== null) {
                        if (property.type === 'Date' || property.type === 'Number') {
                            await this.client.zadd(
                                this.getIndexNumberKeyName(name, property.name),
                                this.convertPropertyTypeToPrimitive(property, entity[property.name]),
                                entity[primary],
                            );
                        } else {
                            await this.client.zadd(
                                this.getIndexKeyName(name, property.name, value), 
                                '0', 
                                entity[primary],
                            );
                        }
                    }

                }
            }
        }
        await this.client.hmset(hashKey, valuesToStore);

        if (canBeListed && persistedEntity === null) {
            await this.client.rpush(this.getListKeyName(name), entity[primary]);
        }

        return null;
    }

    async count<T>(entityType: Type<T>): Promise<number> {
        const { name } = this.metadata.getEntityMetadataFromType(entityType);
        const keyName = this.getListKeyName(name);

        return await this.client.llen(keyName);
    }

    async list<T>(
        entityType: Type<T>, 
        where?: {
            conditions: WhereCondition[],
            type: 'AND' | 'OR',
        },
        limit?: number, 
        offset?: number, 
        orderBy?: OrderBy,
    ): Promise<T[]> {
        const ids = await this.listIds(entityType, where, limit, offset, orderBy);
        const response = [];

        for (const id of ids) {
            response.push(await this.getOne(entityType, id));
        }

        return response;
    }

    async search<T>(entityType: Type<T>, condition: Condition, limit: number): Promise<T[]> {
        const ids = await this.searchIds(entityType, condition, limit);
        const response = [];

        const numberOfResult = (ids.length < limit) ? ids.length : limit;
        for (let index = 0; index < numberOfResult; index++) {
            response.push(await this.getOne(entityType, ids[index]));
        }

        return response;
    }

    async searchIds<T>(entityType: Type<T>, condition: Condition, limit: number): Promise<string[]> {
        const { name } = this.metadata.getEntityMetadataFromType(entityType);

        const key = this.getSearchableKeyName(name, condition.key);
        const value = this.getSearchableValuePrefix('*') + '*' + condition.value.toLowerCase() + '*';

        const response: string[] = [];

        let finishedScanning = false;
        let cursor = 0;
        while (!finishedScanning) {
            const scanResponse = (await this.client.sscan(key, cursor, value));
            cursor = scanResponse.cursor;

            response.push(
                ...scanResponse.data.map((id: string) => id.match(/.+?(?=\:_id_:)/g)[0]),
            );

            if (cursor === 0 || response.length === limit) {
                finishedScanning = true;
            }
        }

        return response;
    }

    async listIds<T>(
        entityType: Type<T>, 
        where?: {
            conditions: WhereCondition[],
            type: 'AND' | 'OR',
        },
        limit?: number, 
        offset?: number, 
        orderBy?: OrderBy,
    ): Promise<string[]> {
        const { name, canBeListed, properties } = this.metadata.getEntityMetadataFromType(entityType);
        if (!canBeListed) {
            throw new Error(entityType.name + ' can\'t be listed!');
        }

        const keyName = this.getListKeyName(name);

        let start = 0;
        let stop = -1;

        if (offset !== undefined) {
            start = offset;
        }

        if (limit !== undefined) {
            stop = start + limit - 1;
        }

        if (orderBy !== undefined && where === undefined) {
            const sortableKey = this.getIndexNumberKeyName(name, orderBy.field);
            

            if (orderBy.strategy === 'ASC') {
                return await this.client.zrange(sortableKey, start, stop);
            } else {
                return await this.client.zrevrange(sortableKey, start, stop);
            }
        }

        if (where !== undefined) {
            if (where.conditions.length === 0) {
                throw new Error('Conditions can\'t be empty');
            }

            const scores: {[key: string]: {min: any, max: any}} = {};

            const equals: WhereCondition[] = [];

            for (const condition of where.conditions) {
                if (condition.comparator === '>') {
                    if (!scores[condition.key]) {
                        scores[condition.key] = {min: '-inf', max: '+inf'};
                    }
                    scores[condition.key].min = this.convertPropertyTypeToPrimitive(properties[condition.key], condition.value);
                }
                if (condition.comparator === '<') {
                    if (!scores[condition.key]) {
                        scores[condition.key] = {min: '-inf', max: '+inf'};
                    }
                    scores[condition.key].max = this.convertPropertyTypeToPrimitive(properties[condition.key], condition.value);
                }

                if (condition.comparator === '!=' || condition.comparator === '=') {
                    
                    if (properties[condition.key] === undefined || !properties[condition.key].indexed) {
                        throw new Error('Property ' + condition.key + ' not found or not indexed');
                    }

                    equals.push(condition);
                }
            }

            if (Object.keys(scores).length === 1 && equals.length === 0 && orderBy === undefined) {
                const scoreKey = Object.keys(scores)[0];
                return await this.client.zrangebyscore(
                    this.getIndexNumberKeyName(name, scoreKey),
                    scores[scoreKey].min, 
                    scores[scoreKey].max,
                    offset ? offset : 0,
                    limit ? limit : -1,
                );
            }

            if (equals.length === 1 && Object.keys(scores).length === 0 && orderBy === undefined && equals[0].comparator != "!=") {
                const condition = equals[0];
                return await this.client.zrange(
                    this.getIndexKeyName(name, condition.key, this.convertPropertyTypeToPrimitive(properties[condition.key], condition.value)),
                    start,
                    stop,
                );
            }

            let luaOrderBy: {
                name: string,
                min: string,
                max: string,
                strategy: 'ASC' | 'DESC'
            } = undefined;

            if (orderBy !== undefined) {
                for (const scoreKey in scores) {
                    if (scoreKey === orderBy.field) {
                        luaOrderBy = {
                            name: scoreKey,
                            min: String(scores[scoreKey].min),
                            max: String(scores[scoreKey].max),
                            strategy: orderBy.strategy,
                        }
                    }
                }
                if (luaOrderBy === undefined) {
                    luaOrderBy = {
                        name: orderBy.field,
                        strategy: orderBy.strategy,
                        min: "-inf",
                        max: "+inf",
                    };
                }
            }

            let luaArgs = {
                prefix: this.getIndexPrefix(name),
                listKey: this.getListKeyName(name),
                tempPrefix: 'temp:' + name + ':',
                orderBy: luaOrderBy,
                scores: Object.keys(scores).map((key: string) => ({
                    min: scores[key].min,
                    max: scores[key].max,
                    key,
                })),
                equals,
                limit: limit ? limit : -1,
                offset: offset ? offset : 0,
                type: where.type,
            };

            return await this.client.eval(
                fs.readFileSync(path.join(__dirname, './lua/complex.query.lua')), 
                0,
                JSON.stringify(luaArgs),
            );

        }

        return await this.client.lrange(keyName, start, stop);
    }

    async delete<T>(entityType: Type<T>, id: string): Promise<void> {
        const { name, uniques, canBeListed } = this.metadata.getEntityMetadataFromType(entityType);
        const hashKey = name + ':' + id;

        const persistedEntity = await this.getOne(entityType, id);
        if (uniques) {
            await this.dropUniqueKeys(persistedEntity);
        }

        if (canBeListed) {
            await this.client.lrem(this.getListKeyName(name), 1, id);
        }

        await this.dropIndexes(persistedEntity, id);

        await this.dropSearchables(persistedEntity);

        await this.client.del(hashKey);
    }

    async getOne<T>(entityType: Type<T>, value: any, key?: string): Promise<T> {
        const entity = Object.create(entityType.prototype);
        const valueAsString = String(value);
        const { name, uniques, primary, properties, hasOneRelations } = this.metadata.getEntityMetadataFromType(entityType);

        // Search for indexes
        let id: string;
        if (key !== undefined && key !== primary) {
            let indexKey;
            for (const uniqueName of uniques) {
                if (uniqueName === key) {
                    indexKey = this.getUniqueKeyName(name, uniqueName);
                }
            }
            if (indexKey === undefined) {
                throw new Error(key + ' is not an unique field!');
            }
            id = await this.client.get(indexKey + ':' + valueAsString);
        } else {
            id = valueAsString;
        }

        const hashKey = name + ':' + id;

        const result = await this.client.hmget(hashKey, Object.keys(properties).map(key => properties[key].name));
        const propertiesArray = Object.keys(properties).map(key => properties[key]);
        let index = 0;
        for (const resultKey of result) {
            if (hasOneRelations !== undefined && hasOneRelations[propertiesArray[index].name] && resultKey !== null) {
                entity[propertiesArray[index].name] = await this.getOne(hasOneRelations[propertiesArray[index].name].entityType() as any, resultKey);
            } else {
                entity[propertiesArray[index].name] = this.convertStringToPropertyType(propertiesArray[index], resultKey);
            }
            index++;
        }
        if (entity[primary] === null) {
            return null;
        }
        return entity;
    }

    private convertPropertyTypeToPrimitive(property: PropertyMetadata, value: any): any {
        if (property.type === 'Date') {
            return value.valueOf();
        }
        return String(value);
    }

    private convertStringToPropertyType(property: PropertyMetadata, value: string): any {
        let convertedValue: any = value;

        switch (property.type) {
            case 'Boolean':
                convertedValue = value === 'true';
                break;
            case 'Number':
                convertedValue = Number(value);
                break;
            case 'Date':
                convertedValue = new Date(Number(value));
                break;
        }

        return convertedValue;
    }

    private async dropUniqueKeys<T>(entity: T): Promise<void> {
        const { name, uniques } = this.metadata.getEntityMetadataFromInstance(entity);
        for (const uniqueName of uniques) {
            await this.client.del(this.getUniqueKeyName(name, uniqueName) + ':' + entity[uniqueName]);
        }
    }

    private async dropIndexes<T>(entity: T, id: string): Promise<void> {
        const { properties } = this.metadata.getEntityMetadataFromInstance(entity);
        for (const property of Object.keys(properties).filter(key => properties[key].indexed).map(key => properties[key])) {
            await this.dropIndex(entity, property, id);
        }
        
    }

    private async dropIndex<T>(entity: T, property: PropertyMetadata, id: string): Promise<void> {
        const { name, hasOneRelations } = this.metadata.getEntityMetadataFromInstance(entity);
        let value = entity[property.name];
        if (hasOneRelations !== undefined && hasOneRelations[property.name]) {
            const relatedEntity = this.metadata.getEntityMetadataFromName(hasOneRelations[property.name].entityType().name);
            value = entity[property.name][relatedEntity.primary];
        }
        if (property.type === 'Date' || property.type === 'Number') {
            await this.client.zrem(this.getIndexNumberKeyName(name, property.name), id);
        } else {
            await this.client.zrem(this.getIndexKeyName(name, property.name, value), id);
        }
    }

    private async dropSearchables<T>(entity: T): Promise<void> {
        const { name, properties, primary } = this.metadata.getEntityMetadataFromInstance(entity);
        for (const property of Object.keys(properties).map(key => properties[key])) {
            if (property.searchable) {
                await this.client.srem(
                    this.getSearchableKeyName(name, property.name),
                    this.getSearchableValuePrefix(entity[primary]) + entity[property.name].toLowerCase(),
                );
            }
        }
    }

    private getIndexNumberKeyName(entityName: string, indexName: string): string {
        return this.getIndexPrefix(entityName) + indexName;
    }

    private getIndexKeyName(entityName: string, indexName: string, indexValue: string): string {
        return this.getIndexPrefix(entityName) + indexName + ':' + indexValue;
    }

    private getIndexPrefix(entityName: string): string {
        return entityName + ':index:';
    }

    private getListKeyName(entityName: string): string {
        return entityName + ':list';
    }

    private getUniqueKeyName(entityName: string, uniqueName: string): string {
        return entityName + ':unique:' + uniqueName;
    }

    private getSearchableKeyName(entityName: string, fieldName: string): string {
        return entityName + ':search:' + fieldName;
    }

    private getSearchableValuePrefix(id: string): string {
        return id + ':_id_:';
    }

}
