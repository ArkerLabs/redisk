import { Entity } from '../../src/decorators/entity.decorator';
import { Primary } from '../../src/decorators/primary.decorator';
import { Property } from '../../src/decorators/property.decorator';

@Entity('group')
export class Group {

  @Primary()
  @Property()
  public readonly id: string;

  @Property()
  public readonly name: string;

  constructor(
      id: string,
      name: string,
    ) {
      this.id = id;
      this.name = name;
  }
}
