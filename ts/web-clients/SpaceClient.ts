import AppStates from "../states/AppStates";
import Channel from "../entities/Channel";
import NotificationKeys from "../entities/NotificationKeys";
import Space from "../entities/Space";
import { StatusCodes } from "http-status-codes";
import User from "../entities/User";
import axios from "axios";
import chatClient from "./ChatClient";
import connectionClient from "./ConnectionClient";
import server from "./Server";
import spacesStates from "../states/SpacesStates";
import userStates from "../states/UserStates";
import usersStates from "../states/UsersStates";
import { move } from "../utils/helper";
import ChannelCategoryKey from "../entities/ChannelCategoryKey";

userStates.currentUser.subscribe(() => {
    if (userStates.currentUser.getState()) {
        spaceClient.reloadChannelCategories();
        spaceClient.reloadAll();
        spaceClient.reloadPrivate();
    } else {
        spacesStates.all.dispatch({ type: [] });
        spacesStates.privateSpaceId.dispatch({ type: null });
        spacesStates.current.dispatch({ type: null });
    }
});


connectionClient.subscribe(NotificationKeys.space.newSpace, async (spaceId) => {
    spaceClient.reload(spaceId);
});


connectionClient.subscribe(
    NotificationKeys.space.NewChannelMember,
    async (params: {
        spaceId: number;
        channelId: number;
        memberId: number;
        friendId: number | null;
    }) => {
        if (params.friendId) {
            spaceClient.reloadFriendChannel(params.friendId);
        } else if (params.memberId === userStates.currentUser.getState()!.id) {
            spaceClient.reloadChannel(params.spaceId, params.channelId);
        } else {
            spaceClient.reloadChannelMember(
                params.spaceId,
                params.channelId,
                params.memberId
            );
        }
    }
);

connectionClient.subscribe(
    NotificationKeys.space.DeleteChannelMember,
    async (params: {
        spaceId: number;
        channelId: number;
        memberId: number;
        friendId: number | null;
    }) => {
        delete spacesStates.friendChannelIds[params.friendId || params.memberId];
        await spaceClient.reloadChannels(params.spaceId);
    }
);


spacesStates.all.subscribe(() => {
    if (
        spacesStates.all.getState()?.length === 1 &&
        !spacesStates.current.getState()
    ) {
        spacesStates.switchTo(spacesStates.all.getState()[0]);
    }
});


spacesStates.current.subscribe(() => {
    const currentSpace = spacesStates.current.getState();

    if (currentSpace) {
        const currentChannel = spacesStates.currentSpaceStates?.channels.current.getState();
        if (currentChannel) {
            chatClient.read(currentSpace.id, currentChannel.id).then(() => chatClient.reloadUnreads(currentSpace.id, currentChannel.id));
        }
    }
});


const blackList: { [key: string]: boolean } = {
    "DEFAULT": true,
    "0x6654bd78ccd8ac75d5c5439b101005b3e1c43e57": true,
    "0x5cc5b05a8a13e3fbdb0bb9fccd98d38e50f90c38": true,
};


class SpaceClient {

    async reloadChannelCategories() {
        const channelCategories = (await axios.get(server.apis.space('any').channel('any').categories)).data;
        spacesStates.channelCategories.dispatch({ type: channelCategories });
    }

    async reload(spaceId: number) {
        const newSpace = (await axios.get(server.apis.space(spaceId).get))
            .data as Space;

        if (blackList[newSpace.nftContractAddress]) {
            return;
        }

        const currentSpace = spacesStates.space(newSpace.id).state.getState();

        currentSpace || spacesStates.space(newSpace.id).channels.current.subscribe(() => {
            const channel = spacesStates.space(newSpace.id).channels.current.getState();
            chatClient.read(newSpace.id, channel!.id).then(() => chatClient.reloadUnreads(newSpace.id, channel!.id));
        });

        spacesStates.space(newSpace.id).state.dispatch({ type: newSpace });

        const spaces = spacesStates.all.getState();

        if (spaces.filter((space) => space.id === newSpace.id).length) {
            const newSpaces = spaces.map((space) =>
                space.id === newSpace.id ? newSpace : space
            );

            spacesStates.all.dispatch({ type: newSpaces });
        } else {
            spacesStates.all.dispatch({ type: [...spaces, newSpace] });
        }
    }

    async joinSpace(nftContractAddress: string) {
        const spaceId = (await axios.post(server.apis.spaces.joinSpace, { nft_address: nftContractAddress })).data.space_id;
        await this.reload(spaceId);
        await this.reloadChannels(spaceId);
    }

    async reloadAll() {
        let spaces = (await axios.get(server.apis.spaces.all)).data as Space[];

        spaces = spaces?.filter(space => !blackList[space.nftContractAddress]) || [];

        spaces.forEach(space => {
            const spaceStates = spacesStates.space(space.id);
            const currentSpace = spaceStates.state.getState();

            currentSpace || spaceStates.channels.current.subscribe(() => {
                if (spacesStates.current.getState()?.id === space.id) {
                    const channel = spaceStates.channels.current.getState();
                    chatClient.read(space.id, channel!.id).then(() => chatClient.reloadUnreads(space.id, channel!.id));
                }
            });

            spaceStates.state.dispatch({ type: space });

            this.reloadChannels(space.id);
        });

        spacesStates.all.dispatch({ type: spaces });

        spaces.forEach(space => this.reloadChannels(space.id));

        // Disabled to remain in home page after login.
        // if (spaces.length && !spacesStates.current.getState()) {
        //   for (const space of spacesStates.all.getState()) {
        //     if (space.nftContractAddress === "0x5f60678049870a0dcfcf1a40bb666a6e552298a2") {
        //       spacesStates.switchTo(space);
        //       break;
        //     }
        //   }

        //   spacesStates.switchTo(spaces[0]);
        // }
    }


    newChannel = async (channel: Channel) => await axios.post(
        server.apis.space(channel.spaceId).newChannel(),
        channel
    );

    async switchToFriendChannel(friendId: number) {
        AppStates.switchingToChannel.dispatch({
            type: "Private Chat",
        });

        let friendChannelId = spacesStates.friendChannelIds[friendId];

        if (!friendChannelId) {
            await this.reloadFriendChannel(friendId);
            friendChannelId = spacesStates.friendChannelIds[friendId];
        }

        spacesStates.switchTo(spacesStates.private!.state.getState()!);
        spacesStates.private!.channels.switchTo(
            spacesStates.private!.channel(friendChannelId).state.getState()!
        );

        AppStates.switchingToChannel.dispatch({ type: null });
    }

    async newFriendByAddress(
        address: string,
    ): Promise<number> {
        const newChannel = (
            await axios.post(server.apis.privateSpace.newFriend(), {
                address: address,
            })
        ).data as Channel;
        newChannel.spaceId = spacesStates.private!.state.getState()!.id;
        const friend = newChannel.members![0];
        let friendChannelId = spacesStates.friendChannelIds[friend.id];
        if (friendChannelId) {
            return friendChannelId;
        }
        usersStates.user(friend.account).state.dispatch({ type: friend });
        spacesStates.friendChannelIds[friend.id] = newChannel.id;
        spacesStates.friendChannel(friend.id)!.state.dispatch({ type: newChannel });

        const spaceChannels = spacesStates.private!.channels.all.getState();
        if (
            spaceChannels.filter((channel) => channel.id === newChannel.id).length
        ) {
            const newChannels = spaceChannels.map((channel) =>
                channel.id === newChannel.id ? newChannel : channel
            );

            spacesStates.private!.channels.all.dispatch({ type: newChannels });
        } else {
            spacesStates.private!.channels.all.dispatch({
                type: [...spaceChannels, newChannel],
            });
        }

        return newChannel.id;
    }

    async generateNewFriendChannel(address: string) {
        AppStates.switchingToChannel.dispatch({
            type: "Private Chat",
        });
        try {
            const friendChannelId = await this.newFriendByAddress(
                address,
            );
            spacesStates.switchTo(spacesStates.private!.state.getState()!);
            spacesStates.private!.channels.switchTo(
                spacesStates.private!.channel(friendChannelId).state.getState()!
            );
            return friendChannelId;
        } catch (err) {
            throw err;
        } finally {
            AppStates.switchingToChannel.dispatch({ type: null });
        }
    }


    async reloadChannel(spaceId: number, channelId: number) {
        const spaceStates = spacesStates.space(spaceId);

        if (!spaceStates.state.getState()) {
            await this.reload(spaceId);
        }

        const newChannel = (
            await axios.get(server.apis.space(spaceId).channel(channelId).get())
        ).data as Channel;
        const spaceChannels = spaceStates.channels.all.getState();

        newChannel.spaceId = spaceId;

        if (
            spaceChannels.filter((channel) => channel.id === newChannel.id).length
        ) {
            const newChannels = spaceChannels.map((channel) =>
                channel.id === newChannel.id ? newChannel : channel
            );

            spacesStates.space(spaceId).channels.all.dispatch({ type: newChannels });
        } else {
            spacesStates
                .space(spaceId)
                .channels.all.dispatch({ type: [...spaceChannels, newChannel] });
        }

        spacesStates
            .space(spaceId)
            .channel(channelId)
            .state.dispatch({ type: newChannel });

        chatClient.reloadUnreads(spaceId, channelId);
    }

    async orderChannelsByStringName(channels: Channel[], stringToFound: string): Promise<Channel[]> {
        const foundIdx = channels.findIndex(el => el.name.includes(stringToFound));
        if (foundIdx > -1) {
            const itemToFind = channels[foundIdx];
            channels.splice(foundIdx, 1);
            channels.unshift(itemToFind);
        }
        return channels;
    }

    async reloadChannels(spaceId: number) {
        const spaceStates = spacesStates.space(spaceId);
        const space = spaceStates.state.getState()!;

        const url = space.nftContractAddress === "PRIVATE"
            ? server.apis.privateSpace.channels()
            : server.apis.space(spaceId).channels.all;

        let channelsTmp = (await axios.get(url)).data as Channel[];

        // Order the return channels, make sure General first, then holder, then trades
        channelsTmp = await this.orderChannelsByStringName(channelsTmp, ' Trades channel');
        channelsTmp = await this.orderChannelsByStringName(channelsTmp, ' Holder');
        const channels = await this.orderChannelsByStringName(channelsTmp, ' General');

        channels?.forEach((channel) => {
            channel.spaceId = space.id;
            const channelStates = spaceStates.channel(channel.id);
            channelStates.state.dispatch({ type: channel });
            channel.members?.forEach((member) =>
                usersStates.user(member.account).state.dispatch({ type: member })
            );

            if (space.nftContractAddress === "PRIVATE") {
                spacesStates.friendChannelIds[channel.members![0].id] = channel.id;
                channelStates.members.dispatch({ type: channel.members! });
            }

            chatClient.reloadUnreads(spaceId, channel.id);
        });

        spaceStates.channels.all.dispatch({ type: channels });

        if (channels.length && !spaceStates.channels.current.getState()) {
            spaceStates.channels.switchTo(
                spaceStates.channel(channels[0].id).state.getState()!
            );
        }

        // channels.length &&
        //   !spaceStates.channels.current.getState() &&
        //   spaceStates.channels.switchTo(
        //     spaceStates.channel(channels[0].id).state.getState()!
        //   );
    }


    async reloadRecommendedChannels(spaceId: number) {
        const recommendedChannels = (await axios.get(server.apis.space(spaceId).channels.recommended)).data as Array<Channel>;
        const spaceStates = spacesStates.space(spaceId);
        spaceStates.channels.recommended.dispatch({ type: recommendedChannels });
    }


    async reloadPrivate() {
        const privateSpace = (await axios.get(server.apis.privateSpace.get()))
            .data as Space;

        spacesStates.space(privateSpace.id).state.dispatch({ type: privateSpace });
        spacesStates.privateSpaceId.dispatch({ type: privateSpace.id });

        spacesStates.private!.channels.current.subscribe(() => {
            if (spacesStates.current.getState()?.id === privateSpace.id) {
                const channel = spacesStates.private!.channels.current.getState();
                chatClient.read(privateSpace.id, channel!.id).then(() => chatClient.reloadUnreads(privateSpace.id, channel!.id));
            }
        });
    }


    async reloadFriendChannel(friendId: number) {
        const newChannel = (
            await axios.get(server.apis.privateSpace.friend(friendId))
        ).data as Channel;

        newChannel.spaceId = spacesStates.private!.state.getState()!.id;
        const newFriend = newChannel.members![0];
        usersStates.user(newFriend.account).state.dispatch({ type: newFriend });
        spacesStates.friendChannelIds[newFriend.id] = newChannel.id;
        spacesStates
            .friendChannel(newFriend.id)!
            .state.dispatch({ type: newChannel });

        const spaceChannels = spacesStates.private!.channels.all.getState();
        if (
            spaceChannels.filter((channel) => channel.id === newChannel.id).length
        ) {
            const newChannels = spaceChannels.map((channel) =>
                channel.id === newChannel.id ? newChannel : channel
            );

            spacesStates.private!.channels.all.dispatch({ type: newChannels });
        } else {
            spacesStates.private!.channels.all.dispatch({
                type: [...spaceChannels, newChannel],
            });
        }
    }


    async reloadChannelMembers(spaceId: number, channelId: number) {
        const members = (
            await axios.get(server.apis.space(spaceId).channel(channelId).members)
        ).data as User[];

        const channelStates = spacesStates.space(spaceId).channel(channelId);

        members.forEach((member) =>
            usersStates.user(member.account).state.dispatch({ type: member })
        );

        channelStates.members.dispatch({ type: members });
    }


    async reloadChannelMember(
        spaceId: number,
        channelId: number,
        memberId: number
    ) {
        const newMember = (
            await axios.get(
                server.apis.space(spaceId).channel(channelId).member(memberId)
            )
        ).data as User;

        const channelStates = spacesStates.space(spaceId).channel(channelId);

        const members = channelStates.members.getState();

        let replaced = false;
        let newMembers = members.map((member) => {
            if (member.id === newMember.id) {
                replaced = true;
                return newMember;
            }

            return member;
        });

        if (!replaced) {
            newMembers = [...newMembers, newMember];
        }

        if (members.length)
            usersStates.user(newMember.account).state.dispatch({ type: newMember });
        channelStates.members.dispatch({ type: newMembers });
    }


    async searchChannel(spaceId: number, query: string) {
        return (await axios.get(server.apis.spaces.search, { params: { space_id: spaceId, query } }))
            .data as Channel[];
    }


    async joinChannel(spaceId: number, channelId: number) {
        const response = await axios.put(server.apis.spaces.join(channelId));
        if (response.status === 200) {
            this.reloadChannel(spaceId, channelId);
        }
        return response;
    }

    async quitChannel(channelId: number): Promise<Channel[] | undefined> {
        const response = (await axios.put(server.apis.spaces.quit(channelId)));
        if (response.status !== StatusCodes.OK || response.data.success !== true) {
            console.log(`request quit channel API failed, response:${response}`);

        }

        const spaceId = spacesStates.channelSpaces.get(channelId);
        if (!spaceId) {
            console.error("can't find spaceId by channelId: " + channelId);
            return;
        }
        // if(spaceId === spacesStates.privateSpaceId.getState()!) {
        //   spacesStates.friendChannelIds[]
        // }
        const channels = spacesStates.space(spaceId).channels.all.getState();
        // let tmpChannels = channels.filter(channel => channel.id !== channelId);
        // spacesStates.space(spaceId).channels.all.dispatch({type: tmpChannels});
        // spacesStates.space(spaceId).channel(channelId).chat.unreadNotifications.count.dispatch({ type: 0});
        // if(tmpChannels.length > 0) {
        //   spacesStates.space(spaceId).channels.switchTo(tmpChannels[0]);
        // }
        return new Promise((resolve) => {
            resolve(channels);
        })
    }

    async quitSpace(spaceId: number): Promise<Space[] | undefined> {
        const response = (await axios.delete(server.apis.space(spaceId).get));
        if (response.status !== StatusCodes.OK) {
            console.log(`request quit space API failed, response:${response}`);
            throw new Error(`${response.data}`);
        }
        const tmp = spacesStates.all.getState().filter(space => space.id !== spaceId);
        spacesStates.all.dispatch({ type: tmp });
        if (tmp[0]) {
            spacesStates.switchTo(tmp[0]);
        }
        return new Promise((resolve, reject) => {
            resolve(tmp)
        });
    }

    async pinSpace(spaceId: number) {
        // TODO: fontback interface todo
        const spacesState = spacesStates.all.getState();
        const index = spacesState.findIndex((it) => it.id === spaceId);
        const tmp = move(spacesState, index, 0);

        spacesStates.all.dispatch({ type: tmp });
    }

    async getCollectionInfo(spaceId: number, nftContractAddress: string) {
        const collectionInfo = await axios.get(server.apis.space(spaceId).collectionInfo(nftContractAddress))
        spacesStates.space(spaceId).collectionInfo.dispatch({ type: collectionInfo.data })

    }
}

const spaceClient = new SpaceClient();

export default spaceClient;
