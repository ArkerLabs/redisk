import { MetadataStorage } from '../metadata/metadata.storage';
import 'reflect-metadata';

export function Property(options: {sortable: boolean, searchable: boolean} = {
    sortable: false,
    searchable: false,
// tslint:disable-next-line: ban-types
}): Function {
    return (object: object, propertyName: string) => {
        const type = Reflect.getMetadata('design:type', object, propertyName).name;

        if (options.sortable && (type !== 'Date' && type !== 'Number')) {
            throw new Error('You can only make Dates and numbers sortables');
        }

        if (MetadataStorage.getGlobal().properties[object.constructor.name] === undefined) {
            MetadataStorage.getGlobal().properties[object.constructor.name] = [];
        }
        MetadataStorage.getGlobal().properties[object.constructor.name].push({
            name: propertyName,
            sortable: options.sortable,
            searchable: options.searchable,
            type,
        });
    };
}
