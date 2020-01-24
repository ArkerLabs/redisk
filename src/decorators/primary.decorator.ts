import { MetadataStorage } from '../metadata/metadata.storage';

// tslint:disable-next-line: ban-types
export function Primary(): Function {
    return (object: object, propertyName: string) => {
        MetadataStorage.getGlobal().primary[object.constructor.name] = propertyName;
    };
}
