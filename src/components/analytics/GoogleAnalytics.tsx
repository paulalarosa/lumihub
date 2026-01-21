import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = "G-13336818738";

export const GoogleAnalytics = () => {
    const location = useLocation();

    useEffect(() => {
        // Initialize GA4 once
        if (!window.GA_INITIALIZED) {
            ReactGA.initialize(GA_MEASUREMENT_ID);
            window.GA_INITIALIZED = true;
        }
    }, []);

    useEffect(() => {
        // Send pageview on route change
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }, [location]);

    return null;
};

// Add type definition for the global flag to avoid TS errors
declare global {
    interface Window {
        GA_INITIALIZED?: boolean;
    }
}
