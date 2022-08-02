import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent, AnalyticsCallOptions } from 'firebase/analytics';
import config from '../config';

export default {
    init: () => {
        const firebaseApp = initializeApp(config.googleAnalytics);

        getAnalytics(firebaseApp);
    },

    logEvent: (
        eventName: string,
        eventParams?: { [key: string]: any },
        options?: AnalyticsCallOptions
    ) => logEvent(getAnalytics(), eventName, eventParams, options)
} as const;