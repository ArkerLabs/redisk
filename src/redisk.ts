import { Type } from './metadata/type';
import * as redis from 'redis';
import * as bluebird from 'bluebird';
import { Metadata } from './metadata/metadata';
import { PropertyMetadata } from './metadata/property.metadata';
import { Condition } from './interfaces/condition';
import { OrderBy } from './interfaces/orderby';

export class Redisk {

    private readonly client;

    constructor(
        private readonly metadata: Metadata,
        redisURL: string,
    ) {
        bluebird.promisifyAll(redis);
        this.client = redis.createClient({url: redisURL});
    }

    /*
    TODO
    - Relations (Reference [Comment contains User])
     */

    async commit<T>(entity: T): Promise<void> {

        const {name, uniques, primary, canBeListed, indexes, properties} = this.metadata.getEntityMetadataFromInstance(entity);

        const hashKey = name + ':' + entity[primary];

        const persistedEntity = await this.getOne<T>(entity.constructor as Type<T>, entity[primary]);
        if (persistedEntity !== null) {
            const changedFields = [];

            for (const property of properties) {
                if (entity[property.name] !== persistedEntity[property.name]) {
                    changedFields.push(property.name);
                    if (property.searchable) {
                        await this.client.sremAsync(
                            this.getSearchableKeyName(name, property.name),
                            this.getSearchableValuePrefix(entity[primary]) + persistedEntity[property.name],
                        );
                    }
                    if (property.sortable) {
                        await this.client.zremAsync(this.getSortableKeyName(name, property.name), persistedEntity[property.name]);
                    }
                }
            }

            if (indexes) {
                const indexesChanged = changedFields.some(value => indexes.indexOf(value) >= 0);
                if (indexesChanged) {
                    await this.dropIndexes(persistedEntity, entity[primary]);
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
                await this.client.setAsync(
                    this.getUniqueKeyName(name, uniqueName) + ':' + entity[uniqueName],
                    entity[primary],
                );
            }
        }

        const valuesToStore = [];
        for (const property of properties) {
            if (entity[property.name] !== null) {
                valuesToStore.push(property.name);
                valuesToStore.push(this.convertPropertyTypeToPrimitive(property, entity[property.name]));

                if (property.sortable === true) {
                    await this.client.zaddAsync(
                        this.getSortableKeyName(name, property.name),
                        this.convertPropertyTypeToPrimitive(property, entity[property.name]),
                        entity[primary],
                    );
                }

                if (property.searchable === true) {
                    await this.client.saddAsync(
                        this.getSearchableKeyName(name, property.name),
                        1,
                        this.getSearchableValuePrefix(entity[primary]) + entity[property.name].toLowerCase(),
                    );
                }
            }
        }
        await this.client.hmsetAsync(hashKey, valuesToStore);

        if (indexes) {
            for (const indexName of indexes) {
                await this.client.saddAsync(this.getIndexKeyName(name, indexName, entity[indexName]), entity[primary]);
            }
        }

        if (canBeListed) {
            await this.client.saddAsync(this.getListKeyName(name), entity[primary]);
        }

        return null;
    }

    async count<T>(entityType: Type<T>): Promise<number> {
        return (await this.listIds(entityType)).length;
    }

    async list<T>(entityType: Type<T>, limit?: number, offset?: number, orderBy?: OrderBy): Promise<T[]> {
        const ids = await this.listIds(entityType, limit, offset, orderBy);
        const response = [];

        for (const id of ids) {
            response.push(await this.getOne(entityType, id));
        }

        return response;
    }

    async find<T>(
        entityType: Type<T>,
        conditions: Condition[],
        limit?: number,
        offset?: number,
        type: 'AND' | 'OR' = 'AND',
    ): Promise<T[]> {
        const ids = await this.findIds(entityType, conditions, type);
        const response = [];

        if (limit !== undefined || offset !== undefined) {
            if (limit === undefined || offset === undefined) {
                throw new Error('You must specify limit and offset, not just one arg.');
            }
            for (let index = offset; index < ids.length && index < (limit + offset); index++) {
                response.push(await this.getOne(entityType, ids[index]));
            }
        } else {
            for (const id of ids) {
                response.push(await this.getOne(entityType, id));
            }
        }

        return response;
    }

    async search<T>(entityType: Type<T>, condition: Condition, limit: number): Promise<T[]> {
        const ids = await this.searchIds(entityType, condition, limit);
        const response = [];

        for (const id of ids) {
            response.push(await this.getOne(entityType, id));
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
            const scanResponse = (await this.client.sscanAsync(key, cursor, 'MATCH', value));
            cursor = Number(scanResponse[0]);

            response.push(
                ...scanResponse[1].map((id: string) => id.match(/.+?(?=\:_id_:)/g)[0]),
            );

            if (cursor === 0 || response.length === limit) {
                finishedScanning = true;
            }
        }

        return response;
    }

    async findIds<T>(entityType: Type<T>, conditions: Condition[], type: 'AND' | 'OR' = 'AND'): Promise<string[]> {

        if (conditions.length === 0) {
            throw new Error('You should at least specify one key to search');
        }

        const { name } = this.metadata.getEntityMetadataFromType(entityType);

        const keyNames: string[] = [];

        for (const condition of conditions) {
            keyNames.push(this.getIndexKeyName(name, condition.key, String(condition.value)));
        }

        if (type === 'AND') {
            return await this.client.sinterAsync(keyNames);
        } else {
            return await this.client.sunionAsync(keyNames);
        }

    }

    async listIds<T>(entityType: Type<T>, limit?: number, offset?: number, orderBy?: OrderBy): Promise<string[]> {
        const { name, canBeListed } = this.metadata.getEntityMetadataFromType(entityType);
        if (!canBeListed) {
            throw new Error(entityType.name + ' can\'t be listed!');
        }

        const keyName = this.getListKeyName(name);

        if (orderBy !== undefined) {
            const sortableKey = this.getSortableKeyName(name, orderBy.field);
            let start = 0;
            let stop = -1;

            if (offset !== undefined) {
                start = offset;
            }

            if (limit !== undefined) {
                stop = start + limit - 1;
            }

            if (orderBy.strategy === 'ASC') {
                return await this.client.zrangeAsync(sortableKey, start, stop);
            } else {
                return await this.client.zrevrangeAsync(sortableKey, start, stop);
            }
        }

        if (limit !== undefined || offset !== undefined) {
            if (limit === undefined || offset === undefined) {
                throw new Error('You must specify limit and offset, not just one arg.');
            }

            return await this.client.sortAsync(keyName, 'ALPHA', 'LIMIT', limit, offset);
        }
        return await this.client.smembersAsync(keyName);
    }

    async delete<T>(entityType: Type<T>, id: string): Promise<void> {
        const { name, uniques, indexes, canBeListed } = this.metadata.getEntityMetadataFromType(entityType);
        const hashKey = name + ':' + id;

        const persistedEntity = await this.getOne(entityType, id);
        if (uniques) {
            await this.dropUniqueKeys(persistedEntity);
        }
        if (indexes) {
            await this.dropIndexes(persistedEntity, id);
        }

        if (canBeListed) {
            await this.client.sremAsync(this.getListKeyName(name), id);
        }

        await this.dropSortables(persistedEntity);
        await this.dropSearchables(persistedEntity);

        await this.client.delAsync(hashKey);
    }

    async getOne<T>(entityType: Type<T>, value: any, key?: string): Promise<T> {
        const entity = Object.create(entityType.prototype);
        const valueAsString = String(value);
        const { name, uniques, primary, properties } = this.metadata.getEntityMetadataFromType(entityType);

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
            id = await this.client.getAsync(indexKey + ':' + valueAsString);
        } else {
            id = valueAsString;
        }

        const hashKey = name + ':' + id;

        const result = await this.client.hmgetAsync(hashKey, properties.map((property: PropertyMetadata) => property.name));
        let index = 0;
        for (const resultKey of result) {
            entity[properties[index].name] = this.convertStringToPropertyType(properties[index], resultKey);
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
            await this.client.delAsync(this.getUniqueKeyName(name, uniqueName) + ':' + entity[uniqueName]);
        }
    }

    private async dropIndexes<T>(entity: T, id: string): Promise<void> {
        const { name, indexes } = this.metadata.getEntityMetadataFromInstance(entity);
        if (indexes) {
            for (const indexName of indexes) {
                await this.client.sremAsync(this.getIndexKeyName(name, indexName, entity[indexName]), id);
            }
        }
    }

    private async dropSearchables<T>(entity: T): Promise<void> {
        const { name, properties } = this.metadata.getEntityMetadataFromInstance(entity);
        for (const property of properties) {
            if (property.sortable === true) {
                await this.client.delAsync(this.getSearchableKeyName(name, property.name));
            }
        }
    }

    private async dropSortables<T>(entity: T): Promise<void> {
        const { name, properties } = this.metadata.getEntityMetadataFromInstance(entity);
        for (const property of properties) {
            if (property.sortable === true) {
                await this.client.delAsync(this.getSortableKeyName(name, property.name));
            }
        }
    }

    private getIndexKeyName(entityName: string, indexName: string, indexValue: string): string {
        return entityName + ':index:' + indexName + ':' + indexValue;
    }

    private getListKeyName(entityName: string): string {
        return entityName + ':list';
    }

    private getUniqueKeyName(entityName: string, uniqueName: string): string {
        return entityName + ':unique:' + uniqueName;
    }

    private getSortableKeyName(entityName: string, fieldName: string): string {
        return entityName + ':sort:' + fieldName;
    }

    private getSearchableKeyName(entityName: string, fieldName: string): string {
        return entityName + ':search:' + fieldName;
    }

    private getSearchableValuePrefix(id: string): string {
        return id + ':_id_:';
    }

}
