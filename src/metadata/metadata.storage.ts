import { StateMetadata } from './state.metadata';

export class MetadataStorage {

    static global: StateMetadata = {
        names: {},
        canBeListed: {},
        uniques: {},
        properties: {},
        primary: {},
        hasOneRelations: {},
    };

    static getGlobal(): StateMetadata {
        return MetadataStorage.global;
    }
}
