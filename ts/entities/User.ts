import Entity from "./Entity";

export default class User extends Entity {
    id!: number;
    name!: string;
    icon!: string;
    account!: string;
}