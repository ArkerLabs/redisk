import { MetadataStorage } from '../metadata/metadata.storage';
import 'reflect-metadata';

export function Property(options: {searchable?: boolean, indexed?: boolean} = {
    searchable: false,
    indexed: false,
// tslint:disable-next-line: ban-types
}): Function {
    return (object: object, propertyName: string) => {
        const type = Reflect.getMetadata('design:type', object, propertyName).name;

        if (MetadataStorage.getGlobal().properties[object.constructor.name] === undefined) {
            MetadataStorage.getGlobal().properties[object.constructor.name] = {};
        }
        MetadataStorage.getGlobal().properties[object.constructor.name][propertyName] = {
            name: propertyName,
            searchable: options.searchable,
            indexed: options.indexed,
            type,
        };
    };
}
