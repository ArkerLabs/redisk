import { MetadataStorage } from '../metadata/metadata.storage';

export function Entity(name: string, options?: {canBeListed: boolean}) {
    return (target: any) => {
        let canBeListed = false;
        if (options !== undefined && options.canBeListed === true) {
            canBeListed = true;
        }
        MetadataStorage.getGlobal().canBeListed[target.name] = canBeListed;
        MetadataStorage.getGlobal().names[target.name] = name;
    };
}
