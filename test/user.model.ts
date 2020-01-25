import { Entity } from '../src/decorators/entity.decorator';
import { Primary } from '../src/decorators/primary.decorator';
import { Property } from '../src/decorators/property.decorator';
import { Unique } from '../src/decorators/unique.decorator';
import { Index } from '../src/decorators/index.decorator';


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

  @Property({sortable: true, searchable: false})
  public readonly created: Date;

  constructor(
      id: string,
      name: string,
      email: string,
      color: string,
      created: Date,
    ) {
      this.id = id;
      this.name = name;
      this.email = email;
      this.color = color;
      this.created = created;
  }
}
