import { PropertyMetadata } from './property.metadata';
import { HasOneOptions } from '../interfaces';

export interface StateMetadata {
    names: { [key: string]: string; };
    canBeListed: { [key: string]: boolean; };
    uniques: { [key: string]: string[]; };
    properties: { [key: string]: { [key: string]: PropertyMetadata} };
    primary: { [key: string]: string; };
    hasOneRelations: { [key: string]: {[key: string]: HasOneOptions } }
}
