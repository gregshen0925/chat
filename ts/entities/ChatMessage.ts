import Entity from "./Entity";
import User from "./User";

export default class ChatMessage extends Entity {
    author!: User;
    datetime!: Date;
    type!: number;
    content!: string;
    isSending = false;
}