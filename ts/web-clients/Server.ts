import config from "../config";

const { baseUrl } = config;

const server = {
    webSocket: baseUrl.replace("https", "wss").replace("http", "ws"),
    apis: {
        time: `${baseUrl}/api/time`,
        cookie: {
            test: `${baseUrl}/api/cookie/test`,
        },
        ranking: `${baseUrl}/api/nftranking/rankings`,
        user: {
            connect: {
                auto: `${baseUrl}/api/user/connect/auto`,
                metaMask: `${baseUrl}/api/user/connect/metamask`,
            },
            sign: `${baseUrl}/api/user/sign`,
            signout: `${baseUrl}/api/user/signout`,
            profile: `${baseUrl}/api/user/profile`,
        },
        nfts: {
            nft: (address: string) => ({
                page: (page: number) =>
                    `${baseUrl}/api/nfts/nft/${address}/page/${page}`,
                asset: (assetId: string) =>
                    `${baseUrl}/api/nfts/nft/${address}/asset/${assetId}`,
                collection: (page: number) => `${baseUrl}/api/nfts/nft/collection/${address}/page/${page}`
            }),
            user: (address: string) => ({
                page: (page: number) =>
                    `${baseUrl}/api/nfts/user/${address}/page/${page}`,
                orderAssets: (side: number) =>
                    `${baseUrl}/api/nfts/nft/user/${address}?side=${side}`
            }),
        },
        spaces: {
            all: `${baseUrl}/api/spaces`,
            new: `${baseUrl}/api/spaces/new`,
            search: `${baseUrl}/api/spaces/search`,
            joinSpace: `${baseUrl}/api/spaces`,
            join: (channelId: number) => `${baseUrl}/api/spaces/join/${channelId}`,
            quit: (channelId: number) => `${baseUrl}/api/spaces/quit/${channelId}`,
            channels: {},
        },
        privateSpace: {
            get: () => server.apis.space("private").get,
            channels: () => server.apis.space("private").channels.all,
            friend: (friendId: number) => server.apis.space("private").channel("friend").get(friendId),
            newFriend: () => server.apis.space("private").channel("friend").newFriend,
        },
        space: (spaceId: number | string) => ({
            get: `${baseUrl}/api/space/${spaceId}/`,
            channels: {
                all: `${baseUrl}/api/space/${spaceId}/channels`,
                recommended: `${baseUrl}/api/space/${spaceId}/channels/recommended`,
            },
            newChannel: () => server.apis.space(spaceId).channel("new").get(),
            channel: (channelId: number | string) => ({
                categories: `${baseUrl}/api/space/${spaceId}/channel/categories`,
                members: `${baseUrl}/api/space/${spaceId}/channel/${channelId}/members`,
                member: (memberId: number) => `${baseUrl}/api/space/${spaceId}/channel/${channelId}/member/${memberId}`,
                chat: {
                    send: `${baseUrl}/api/space/${spaceId}/channel/${channelId}/chat/send`,
                    messages: {
                        last: `${baseUrl}/api/space/${spaceId}/channel/${channelId}/chat/messages/last`,
                        before: (time: Date) => `${baseUrl}/api/space/${spaceId}/channel/${channelId}/chat/messages/before/${time}`,
                        from: (time: Date) => `${baseUrl}/api/space/${spaceId}/channel/${channelId}/chat/messages/from/${time}`,
                        unread: `${baseUrl}/api/space/${spaceId}/channel/${channelId}/chat/messages/unread`,
                        read: `${baseUrl}/api/space/${spaceId}/channel/${channelId}/chat/messages/read`,
                    },
                },
                newFriend: `${baseUrl}/api/space/${spaceId}/channel/${channelId}/new`,
                get: (friendId: number | null = null) =>
                    friendId
                        ? `${baseUrl}/api/space/${spaceId}/channel/${channelId}/${friendId}`
                        : `${baseUrl}/api/space/${spaceId}/channel/${channelId}`,
            }),
            nfts: {
                page: (pageNumber: number) => `${baseUrl}/api/space/${spaceId}/nfts/page/${pageNumber}`,
            },
            collectionInfo: (nftcontractaddress: string) => `${baseUrl}/api/space/${spaceId}/${nftcontractaddress}`
        }),
        order: {
            newOrder: `${baseUrl}/api/order/new`,
            order: `${baseUrl}/api/order`,
            fulfillOrder: `${baseUrl}/api/order/fulfillOrder`,
        },
        tools: {
            priceConversion: `${baseUrl}/api/tools/currencies/price-conversion`
        },
        activities: {
            user: (user_address: string | null, cursor: number | null) => `${baseUrl}/api/activities/user?user_address=${user_address}&cursor=${cursor}`,
            collection: (nft_collection_contract_address: string | null, cursor: number | null) => `${baseUrl}/api/activities/nftcollection?nft_collection_contract_address=${nft_collection_contract_address}&cursor=${cursor}`,
        }
    },
};

export default server;
