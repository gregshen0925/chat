import ChannelCategoryKey from "./ChannelCategoryKey";
import Entity from "./Entity";
// import Space from "./Space";
import User from "./User";

export enum ChannelCategory {
    General = "general"
}

export default class Channel extends Entity {
    name!: string;
    icon!: string;
    description!: string;
    isGeneral!: boolean;
    members?: Array<User>;
    spaceId!: number;
    isCreating = false;
    joined?: any;

    configuration!: {
        category: ChannelCategoryKey;
        createdBy: string;
        createdTime: string;
    }
}
