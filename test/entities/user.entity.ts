import { Entity } from '../../src/decorators/entity.decorator';
import { Primary } from '../../src/decorators/primary.decorator';
import { Property } from '../../src/decorators/property.decorator';
import { Unique } from '../../src/decorators/unique.decorator';
import { HasOne } from '../../src/decorators/hasone.decorator';
import { Group } from './group.entity';


@Entity('user', { canBeListed: true })
export class User {

  @Primary()
  @Property()
  public readonly id: string;

  @Property({searchable: true})
  public readonly name: string;

  @Property()
  public readonly description: string;

  @Unique()
  @Property()
  public readonly email: string;

  @Property({indexed: true})
  public readonly color: string;

  @Property({indexed: true})
  public readonly food: string;

  @HasOne(type => Group, {cascadeInsert: true, cascadeUpdate: true})
  @Property({indexed: true})
  public readonly group: Group;

  @Property({indexed: true})
  public readonly created: Date;

  constructor(
      id: string,
      name: string,
      description: string,
      email: string,
      color: string,
      food: string,
      group: Group,
      created: Date,
    ) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.email = email;
      this.color = color;
      this.food = food;
      this.group = group;
      this.created = created;
  }
}
