import { PropertyMetadata } from './property.metadata';

export interface EntityMetadata {
    name: string;
    primary: string;
    indexes: string[];
    uniques: string[];
    properties: PropertyMetadata[];
    canBeListed: boolean;
}
