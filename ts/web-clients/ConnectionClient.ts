import NotificationKeys from "../entities/NotificationKeys";
import UserStates from "../states/UserStates";
import server from "./Server";

class ConnectionClient {
    connection: WebSocket | null = null;
    heartbeatInterval: any = null;
    lastBeat = new Date();
    lastConnect = new Date();
    lastSentBeat = new Date();
    lastPing = new Date();

    private subscriptions: { [key: string]: ((params: any) => Promise<void>)[] } = {};
    private stampSubscriptions: { [stamp: string]: ((notification: string, params: any) => Promise<void>)[] } = {};

    connect() {
        this.disconnect();

        const connection = new WebSocket(server.webSocket);

        connection.onopen = event => {
            this.connection = connection;
        };

        connection.onclose = event => {
            this.disconnect();
        };

        connection.onmessage = event => {
            if (event.data === 'connected') {

            } else if (event.data) {
                const message = JSON.parse(event.data);
                this.publish(message.key, message.params);

                message.params?.stamp
                    && this.notifyStamp(message.params.stamp, message.key, message.params);
            }
        }

        connection.onerror = event => {

        }

        this.connection = connection;

        this.startHeartbeat();
    }


    disconnect() {
        const connection = this.connection;
        if (connection) {
            this.connection = null;
            connection.CLOSED !== connection.readyState && connection.close();
        }
    }


    subscribe(key: string, callback: (params: any) => Promise<void>) {
        this.subscriptions[key] = this.subscriptions[key] || [];
        this.subscriptions[key].push(callback);

        return () => delete this.subscriptions[key];
    }


    async publish(key: string, params: any = null) {
        this.subscriptions[key]?.forEach(subscription => subscription(params));
    }


    waitForStamp = (stamp: string, callback: (notification: string, params: any) => Promise<void>) => {
        this.stampSubscriptions[stamp] = this.stampSubscriptions[stamp] || [];
        this.stampSubscriptions[stamp].push(callback);
    }


    notifyStamp = async (stamp: string, notification: string, params: any) => {
        const callbacks = this.stampSubscriptions[stamp];
        delete this.stampSubscriptions[stamp];

        callbacks?.forEach(callback => {
            try {
                callback(notification, params);
            } catch (error) {
                console.error({ stamp, notification, error });
            }
        });
    }


    startHeartbeat() {
        if (!this.heartbeatInterval) {
            this.subscribe(NotificationKeys.heartbeat, async () => {
                this.lastPing = new Date();
            });

            this.heartbeatInterval = setInterval(() => {
                if (UserStates.currentUser.getState()) {
                    this.lastBeat = new Date();

                    if (!this.connection) {
                        const expiry = new Date(this.lastConnect.getTime());
                        expiry.setSeconds(this.lastConnect.getSeconds() + 1);

                        if (expiry < new Date()) {
                            this.lastConnect = new Date();
                            this.connect();
                        }
                    } else {
                        const expiry = new Date(this.lastSentBeat.getTime());
                        expiry.setSeconds(this.lastSentBeat.getSeconds() + 10);

                        if (expiry < new Date()) {
                            this.lastSentBeat = new Date();

                            if (this.connection.readyState === this.connection.CLOSED) {
                                this.disconnect();
                            } else {
                                this.connection!.send(NotificationKeys.heartbeat);
                            }
                        }
                    }
                }
            }, 1000 * 3);
        }
    }
}


const connectionClient = new ConnectionClient();


UserStates.currentUser.subscribe(() => UserStates.currentUser.getState() && connectionClient.connect());


export default connectionClient;