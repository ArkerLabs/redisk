export interface WhereCondition {
    key: string;
    value: any;
    comparator: '>' | '<' | '=' | '!=';
}
