import { Type } from '../metadata';

export interface HasOneOptions {
    entityType: () => Type<any>;
    cascadeInsert: boolean;
    cascadeUpdate: boolean;
}