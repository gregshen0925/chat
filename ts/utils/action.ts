import axios, { AxiosResponse } from "axios";
import config from "../config";
import connectionClient from "../web-clients/ConnectionClient";

export class Action {
    constructor(
        path: string,
        public method: string
    ) {
        this.url = config.baseUrl + path;
    }

    url;

    invoke = async (
        params?: any & {
            callback?: (notificaiton: string, params: any) => Promise<void>,
            onError?: (reason: any) => Promise<void>
        }
    ) => {
        const { url, method } = this;

        const { callback, onError } = params || {};
        if (params) {
            delete params.callback;
            delete params.onError;
        }

        const response = await ({
            'post': () => axios.post(url, params),
            'put': () => axios.put(url, params),
            'patch': () => axios.patch(url, params),
            'delete': () => axios.delete(url)
        } as { [method: string]: () => Promise<AxiosResponse<any, any>> })[method]()
            .catch(async reason => {
                onError && onError(reason);
                !onError && console.info({ actionFail: { url, method, reason } });

                return { data: '' };
            });

        if (!response.data) {
            return;
        }

        const stamp = response.data as string;

        callback && connectionClient.waitForStamp(stamp, callback);
    }
}


export default function action({ path, method }: {
    path: string,
    method: 'post' | 'put' | 'patch' | 'delete'
}) {
    return new Action(path, method);
}