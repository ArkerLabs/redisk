import { PropertyMetadata } from './property.metadata';
import { HasOneOptions } from '../interfaces';

export interface EntityMetadata {
    name: string;
    primary: string;
    indexes: string[];
    uniques: string[];
    properties: PropertyMetadata[];
    canBeListed: boolean;
    hasOneRelations: {[key: string]: HasOneOptions };
}
