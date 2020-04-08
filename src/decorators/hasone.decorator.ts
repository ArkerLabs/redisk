import { MetadataStorage } from '../metadata/metadata.storage';
import 'reflect-metadata';
import { Type } from '../metadata';

export function HasOne<T>(type: (type?: any) => Type<T>, options: {cascadeInsert: boolean, cascadeUpdate: boolean} = {
    cascadeInsert: false,
    cascadeUpdate: false,
// tslint:disable-next-line: ban-types
}): Function {
    return (object: object, propertyName: string) => {
        if (MetadataStorage.getGlobal().hasOneRelations[object.constructor.name] === undefined) {
            MetadataStorage.getGlobal().hasOneRelations[object.constructor.name] = {};
        }
        MetadataStorage.getGlobal().hasOneRelations[object.constructor.name][propertyName] = {
            cascadeInsert: options.cascadeInsert,
            cascadeUpdate: options.cascadeUpdate,
            entityType: type,
        };
    };
}
