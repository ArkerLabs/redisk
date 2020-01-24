import { PropertyMetadata } from './property.metadata';

export interface StateMetadata {
    names: { [key: string]: string; };
    canBeListed: { [key: string]: boolean; };
    indexes: { [key: string]: string[]; };
    uniques: { [key: string]: string[]; };
    properties: { [key: string]: PropertyMetadata[]; };
    primary: { [key: string]: string; };
}
