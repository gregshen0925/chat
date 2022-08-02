import Asset from "../entities/Asset";
import AssetsStates from "./AssetsStates";
import Channel from "../entities/Channel";
import ChannelCategory from "../entities/Channel";
import Chat from "../entities/Chat";
import ChatMessage from "../entities/ChatMessage";
import NotificationsStates from "./NotificationsStates";
import Offer from "../entities/Offer";
import Space from "../entities/Space";
import User from "../entities/User";
import createValueStore from "./CreateValueStore";
import getOrNewValue from "./GetOrNewValue";
import googleAnalyticsClient from "../web-clients/google-analytics-client";
import NFTCollectionModel from "../entities/NFTCollectionModel";

const spacesStates = {

    channelCategories: createValueStore<Array<ChannelCategory>>([]),

    all: createValueStore<Array<Space>>([]),

    privateSpaceId: createValueStore<number>(),

    get private() {
        return this.privateSpaceId.getState()
            ? spacesStates.space(this.privateSpaceId.getState()!)
            : null
    },

    channelSpaces: new Map<number | string, number>(),

    friendChannelIds: {} as { [friendId: number]: number },

    friendChannel: (friendId: number) => spacesStates.private?.channel(spacesStates.friendChannelIds[friendId]),

    current: createValueStore<Space>(),

    get currentSpaceStates() {
        const spaceId = spacesStates.current.getState()?.id;
        if (!spaceId) {
            return null;
        }

        return spacesStates.space(spaceId);
    },

    space: (spaceId: number) => getOrNewValue('space', spaceId.toString(), () => {

        const spaceStates = {

            state: createValueStore<Space>(),

            channels: {

                all: createValueStore<Array<Channel>>([]),

                recommended: createValueStore<Array<Channel>>(),

                current: createValueStore<Channel>(),

                get currentChannelStates() {
                    const currentChannelId = spacesStates.currentSpaceStates?.channels.current.getState()?.id;

                    if (!currentChannelId) {
                        return null;
                    }

                    return spacesStates.currentSpaceStates.channel(currentChannelId);
                },

                switchTo: async (channel: Channel) => {
                    spacesStates.space(spaceId).channels.current.dispatch({ type: channel });

                    googleAnalyticsClient.logEvent("switch_to_channel", {
                        id: channel.id,
                        name: channel.name
                    });
                },

            },

            channel: (channelId: number | string) => getOrNewValue('channel', channelId.toString(), () => {

                const channelStates = {

                    state: createValueStore<Channel>(),

                    members: createValueStore<Array<User>>([]),

                    chat: {

                        state: createValueStore<Chat>(),

                        messages: createValueStore<Array<ChatMessage>>([]),

                        lastMessage: createValueStore<ChatMessage>(),

                        firstDate: createValueStore<Date>(),

                        lastDate: createValueStore<Date>(),

                        noMoreHistory: createValueStore(false),

                        isLoadingHistory: createValueStore(false),

                        isLoadingNew: createValueStore(false),

                        text: createValueStore(''),

                        offer: createValueStore<Offer>(),

                        asset: createValueStore<Asset>(),

                        lastRead: createValueStore(new Date()),

                        read: () => {
                            const messages = channelStates.chat.messages.getState();
                            const lastRead = messages.length ? messages[messages.length - 1].datetime : new Date();
                            channelStates.chat.lastRead.dispatch({ type: lastRead });
                        },

                        unreadNotifications: NotificationsStates.collection(`channel-${channelId}`)

                    }

                };

                spaceStates.unreadNotifications.sumWith(`channel-${channelId}`);

                spacesStates.channelSpaces.set(channelId, spaceId);

                return channelStates;
            }),

            unreadNotifications: NotificationsStates.collection(`space-${spaceId}`),

            get assets() {
                return AssetsStates.assets(this.state.getState()!.nftContractAddress);
            },

            collectionInfo: createValueStore<any>(),

        };

        spaceStates.channels.current.subscribe(() => {
            const current = spaceStates.channels.current.getState();

            current
                && spacesStates.current.getState()?.id === spaceId
                && spaceStates.channel(current.id).chat.read();
        });

        return spaceStates;
    }),

    switchTo: async (space: Space | null) => spacesStates.current.dispatch({ type: space })

};


spacesStates.current.subscribe(() => {
    const currentSpace = spacesStates.current.getState();

    if (currentSpace) {
        const currentSpaceStates = spacesStates.space(currentSpace.id);
        const currentChannel = currentSpaceStates.channels.current.getState();

        if (currentChannel) {
            const currentChannelStates = currentSpaceStates.channel(currentChannel.id);
            currentChannelStates.chat.read();
        }
    }
});


export default spacesStates;
