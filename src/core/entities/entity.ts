import { UniqueEntityID } from './unique-entity-id.js'

export class Entity<TProps> {
  private _id: UniqueEntityID
  protected props: TProps

  constructor(props: TProps, id?: string) {
    this._id = new UniqueEntityID(id)
    this.props = props
  }

  public getId(): string {
    return this._id.toValue()
  }
}
