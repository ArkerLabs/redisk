import { Type } from '../metadata';

export interface HasOneOptions {
    entity: string;
    entityType: Type<any>;
    cascadeInsert: boolean;
    cascadeUpdate: boolean;
}