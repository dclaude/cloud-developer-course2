import { Table, Column, Model, PrimaryKey, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table
export class User extends Model<User> {
  @PrimaryKey
  @Column
  public email!: string;

  @Column
  public password_hash!: string; // for nullable fields

  @Column
  @CreatedAt
  public createdAt: Date = new Date();

  @Column
  @UpdatedAt
  public updatedAt: Date = new Date();

  public short(): { email: string } {
    return {
      email: this.email
    };
  }
}
