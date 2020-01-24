import { MetadataStorage } from '../metadata/metadata.storage';

// tslint:disable-next-line: ban-types
export function Index(): Function {
    return (object: object, propertyName: string) => {
        if (MetadataStorage.getGlobal().indexes[object.constructor.name] === undefined) {
            MetadataStorage.getGlobal().indexes[object.constructor.name] = [];
        }
        MetadataStorage.getGlobal().indexes[object.constructor.name].push(propertyName);
    };
}
