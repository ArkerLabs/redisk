import { Entity } from '../../src/decorators/entity.decorator';
import { Primary } from '../../src/decorators/primary.decorator';
import { Property } from '../../src/decorators/property.decorator';
import { Unique } from '../../src/decorators/unique.decorator';
import { Index } from '../../src/decorators/index.decorator';
import { HasOne } from '../../src/decorators/hasone.decorator';
import { Group } from './group.model';


@Entity('user', { canBeListed: true })
export class User {

  @Primary()
  @Property()
  public readonly id: string;

  @Property({sortable: false, searchable: true})
  public readonly name: string;

  @Unique()
  @Property()
  public readonly email: string;

  @Index()
  @Property()
  public readonly color: string;

  @Index()
  @Property()
  public readonly food: string;

  @HasOne(Group, {cascadeInsert: true, cascadeUpdate: true})
  @Index()
  @Property()
  public readonly group: Group;

  @Property({sortable: true, searchable: false})
  public readonly created: Date;

  constructor(
      id: string,
      name: string,
      email: string,
      color: string,
      food: string,
      group: Group,
      created: Date,
    ) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.color = color;
      this.food = food;
      this.group = group;
      this.created = created;
  }
}
