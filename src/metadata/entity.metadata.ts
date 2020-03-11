import { PropertyMetadata } from './property.metadata';
import { HasOneOptions } from '../interfaces';

export interface EntityMetadata {
    name: string;
    primary: string;
    uniques: string[];
    properties: {[key: string] : PropertyMetadata};
    canBeListed: boolean;
    hasOneRelations: {[key: string]: HasOneOptions };
}
