import { User } from '../entities/user.entity';
import { groups } from './groups';

export const users = [
    new User('4409', 'John', '', 'john@email.com', 'red', 'tofu', groups[0], new Date('2020-02-22 10:00:00')),
    new User('F8AC', 'Anthony', '', 'anthony@email.com', 'blue', 'avocado', groups[0], new Date('2020-02-22 12:34:00')),
    new User('ACEF', 'Juan', '', 'juan@email.com', 'blue', 'tofu', null, new Date('2020-02-22 18:10:00')),
    new User('A366', 'Jim', '', 'jim@email.com', 'blue', 'tofu', groups[1], new Date('2020-02-23 22:35:00')),
    new User('D162', 'Rick', '', 'rick@email.com', 'red', 'rice', groups[1], new Date('2020-02-24 12:00:00')),
];