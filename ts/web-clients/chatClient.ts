import ChatMessage from "../entities/ChatMessage";
import ChatMessageTypes from "../entities/ChatMessageTypes";
import NotificationKeys from "../entities/NotificationKeys";
import UserStates from "../states/UserStates";
import axios from "axios";
import connectionClient from "./ConnectionClient";
import server from "./Server";
import spaceClient from "./SpaceClient";
import spacesStates from "../states/SpacesStates";
import readMessagesAction from "../states/spaces/channels/chat/read-messages-action";
import baseClient from "./BaseClient";
import AppStates from "../states/AppStates";

connectionClient.subscribe(NotificationKeys.chat.newMessage, async (params) => {
    const { channelId } = params;
    const spaceId = spacesStates.channelSpaces.get(channelId);

    if (spaceId && channelId) {
        chatClient.loadLastMessage(spaceId, channelId);
        await chatClient.loadNewMessages(spaceId, channelId);

        if (spacesStates.current.getState()?.id === spaceId
            && spacesStates.currentSpaceStates?.channels.current.getState()?.id === channelId
        ) {
            chatClient.read(spaceId, channelId);
            readMessagesAction(spaceId, channelId).invoke();
        } else {
            chatClient.reloadUnreads(spaceId, channelId);
        }
    }
});

class ChatClient {

    async send(spaceId: number, channelId: number, orderHash: string | null = null) {
        const chatStates = spacesStates.space(spaceId).channel(channelId).chat;
        const [type, message] = (() => {
            const offer = chatStates.offer.getState();
            if (offer) {
                return [ChatMessageTypes["offer"], {
                    nft: offer.asset.address,
                    asset: offer.asset.id,
                    orderHash: orderHash,
                    price: offer.price,
                    metadata: offer.asset,
                }];
            }

            const asset = chatStates.asset.getState();
            if (asset) {
                return [ChatMessageTypes["asset"], {
                    nft: asset.address,
                    asset: asset.id,
                    mode: 'icon'
                }];
            }

            const text = chatStates.text.getState();

            if (text) {
                return [ChatMessageTypes["text"], text];
            }

            return [null, null];
        })();

        if (!message) {
            return;
        }

        const tempMessage = {
            id: -1,
            author: UserStates.currentUser.getState(),
            datetime: new Date(),
            content: typeof message === 'object' ? JSON.stringify(message) : message,
            type: type,
            isSending: true,
        } as ChatMessage;

        chatStates.messages.dispatch({ type: [...chatStates.messages.getState(), tempMessage] });

        axios.post(server.apis.space(spaceId).channel(channelId).chat.send, {
            message,
            type,
        });

        spacesStates.space(spaceId).channel(channelId).chat.text.dispatch({ type: "" });
        spacesStates.space(spaceId).channel(channelId).chat.offer.dispatch({ type: null });
        spacesStates.space(spaceId).channel(channelId).chat.asset.dispatch({ type: null });
    }


    async loadLastMessages(spaceId: number, channelId: number) {
        const chatStates = spacesStates.space(spaceId).channel(channelId).chat;

        if (chatStates.noMoreHistory.getState()) {
            return;
        }

        chatStates.isLoadingHistory.dispatch({ type: true });
        let beforeTime = chatStates.firstDate.getState();

        if (!beforeTime) {
            beforeTime = new Date();
            beforeTime.setDate(beforeTime.getDate() + 2);
        }

        let response = await axios.get(
            server.apis
                .space(spaceId)
                .channel(channelId)
                .chat.messages.before(beforeTime)
        );
        const newMessages = response.data.items as Array<ChatMessage>;

        newMessages.forEach((message) => {
            message.datetime = new Date(message.datetime);
        });

        const currentMessages = chatStates.messages.getState();

        if (
            !newMessages.length ||
            (currentMessages.length && newMessages[0].id === currentMessages[0].id)
        ) {
            chatStates.noMoreHistory.dispatch({ type: true });
        }

        this.updateChatMessages(spaceId, channelId, newMessages);
        chatStates.isLoadingHistory.dispatch({ type: false });
    }

    async loadNewMessages(spaceId: number, channelId: number) {
        const spaceStates = spacesStates.space(spaceId);
        const chatStates = spaceStates.channel(channelId).chat;
        chatStates.isLoadingNew.dispatch({ type: true });

        const fromTime = chatStates.lastDate.getState();

        if (!fromTime) {
            await this.loadLastMessages(spaceId, channelId);
            chatStates.isLoadingNew.dispatch({ type: false });
            return;
        }

        let response = await axios.get(
            server.apis.space(spaceId).channel(channelId).chat.messages.from(fromTime)
        );
        const newMessages = response.data.items as Array<ChatMessage>;

        newMessages.forEach((message: any) => {
            message.datetime = new Date(message.datetime);
        });

        this.updateChatMessages(spaceId, channelId, newMessages);

        const messages = chatStates.messages.getState();
        messages.length < response.data.length && chatStates.noMoreHistory.dispatch({ type: true });

        chatStates.isLoadingNew.dispatch({ type: false });
    }


    async loadLastMessage(spaceId: number, channelId: number) {
        const chatStates = spacesStates.space(spaceId).channel(channelId).chat;

        let response = await axios.get(
            server.apis
                .space(spaceId)
                .channel(channelId)
                .chat
                .messages
                .last
        );
        const message = response.data as ChatMessage;
        if (message) {
            message.datetime = new Date(message.datetime);
        }
        chatStates.lastMessage.dispatch({ type: message });
    }

    private updateChatMessages(
        spaceId: number,
        channelId: number,
        newMessages: Array<ChatMessage>
    ) {
        const chatStates = spacesStates.space(spaceId).channel(channelId).chat;
        const currentMessages = chatStates.messages.getState();

        let filteredIds = new Set<number>();
        let messages = [...currentMessages, ...newMessages]
            .sort((a, b) => a.datetime.getTime() - b.datetime.getTime())
            .filter((message) => !message.isSending)
            .filter(
                (message) =>
                    !filteredIds.has(message.id) && filteredIds.add(message.id) && true
            );

        if (messages.length) {
            chatStates.firstDate.dispatch({ type: messages[0].datetime });
            chatStates.lastDate.dispatch({
                type: messages[messages.length - 1].datetime,
            });
        } else {
            baseClient.reloadSystemTime().then(() => {
                chatStates.firstDate.dispatch({ type: AppStates.severTime.getState() });
                chatStates.lastDate.dispatch({ type: AppStates.severTime.getState() });
            })
        }

        chatStates.messages.dispatch({ type: messages });
    }

    async chatToFriend(friendId: number) {
        await spaceClient.switchToFriendChannel(friendId);
    }

    async reloadUnreads(spaceId: number, channelId: number) {
        const unreads = (await axios.get(server.apis.space(spaceId).channel(channelId).chat.messages.unread)).data;

        spacesStates.space(spaceId).channel(channelId).chat.unreadNotifications.count.dispatch({ type: unreads });
    }

    async read(spaceId: number, channelId: number) {
        await axios.patch(server.apis.space(spaceId).channel(channelId).chat.messages.read);
    }
}

const chatClient = new ChatClient();
export default chatClient;
