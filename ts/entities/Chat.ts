import ChatMessage from "./ChatMessage";
import Entity from "./Entity";

export default class Chat extends Entity {
    messages!: Array<ChatMessage>;
}