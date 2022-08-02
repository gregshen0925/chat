import action from "../../../../utils/action";

export default function readMessagesAction(spaceId: number, channelId: number) {
    return action({
        path: `/api/spaces/${spaceId}/channels/${channelId}/chat/messages/read`,
        method: 'patch'
    })
}