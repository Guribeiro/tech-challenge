import { UniqueEntityID } from './unique-entity-id.js'

export class Entity<TProps> {
  private _id: UniqueEntityID
  protected props: TProps

  constructor(props: TProps, id?: UniqueEntityID) {
    this.props = props
    this._id = id ?? new UniqueEntityID()
  }

  public getId(): UniqueEntityID {
    return this._id
  }


  public equals(entity: Entity<any>) {
    if (entity === this) {
      return true
    }

    if (entity._id === this._id) {
      return true
    }

    return false
  }
}
