import { Entity } from '../src/decorators/entity.decorator';
import { Primary } from '../src/decorators/primary.decorator';
import { Property } from '../src/decorators/property.decorator';

@Entity('comment')
export class Comment {

  @Primary()
  @Property()
  public readonly id: string;

  @Property()
  public readonly text: string;

  constructor(
      id: string,
      text: string,
    ) {
      this.id = id;
      this.text = text;
  }
}
