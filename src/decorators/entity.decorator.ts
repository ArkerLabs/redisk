import { MetadataStorage } from '../metadata/metadata.storage';

export function Entity(name: string, options?: {canBeListed: boolean}) {
    return (target: any) => {
        let canBeListed = true;
        if (options !== undefined && options.canBeListed === false) {
            canBeListed = false;
        }
        MetadataStorage.getGlobal().canBeListed[target.name] = canBeListed;
        MetadataStorage.getGlobal().names[target.name] = name;
    };
}
