import { MetadataStorage } from './metadata.storage';
import { EntityMetadata } from './entity.metadata';
import { Type } from './type';

export class Metadata {

    public getEntityMetadataFromInstance<T>(entity: T): EntityMetadata {
        return this.getEntityMetadata(entity.constructor.name);
    }

    public getEntityMetadataFromType<T>(entityType: Type<T>): EntityMetadata {
        return this.getEntityMetadata(entityType.name);
    }

    private getEntityMetadata<T>(entityName: string): EntityMetadata {
        const { names, indexes, primary, properties, canBeListed, uniques } = MetadataStorage.getGlobal();

        if (primary[entityName] === undefined) {
            throw new Error(entityName + ' doesn\'t have a primary key defined!');
        }

        return {
            name: names[entityName],
            primary: primary[entityName],
            indexes: indexes[entityName],
            uniques: uniques[entityName],
            properties: properties[entityName],
            canBeListed: canBeListed[entityName],
        };
    }

}
