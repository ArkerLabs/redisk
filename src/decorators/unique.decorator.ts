import { MetadataStorage } from '../metadata/metadata.storage';

// tslint:disable-next-line: ban-types
export function Unique(): Function {
    return (object: object, propertyName: string) => {
        if (MetadataStorage.getGlobal().uniques[object.constructor.name] === undefined) {
            MetadataStorage.getGlobal().uniques[object.constructor.name] = [];
        }
        MetadataStorage.getGlobal().uniques[object.constructor.name].push(propertyName);
    };
}
