import { createAuth0Client } from "@auth0/auth0-spa-js";
import { authError } from "../stores";

let authClient;

const isTestingCI = import.meta.env.PROD && window.location.protocol === "http:"; // E2E tests run in PROD mode but in http
const isDev = import.meta.env.DEV;
const useTestCredentials = isDev || isTestingCI;

async function init() {
    authClient = await createAuth0Client({
        domain: useTestCredentials ? import.meta.env.VITE_AUTH0_DOMAIN_TEST : import.meta.env.VITE_AUTH0_DOMAIN,
        clientId: useTestCredentials ? import.meta.env.VITE_AUTH0_CLIENT_TEST : import.meta.env.VITE_AUTH0_CLIENT,
        authorizationParams: {
            redirect_uri: window.location.origin,
        },
    });
    return authClient;
}

async function handleRedirectionLogin() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasBeenLogged = urlParams.has("code") && urlParams.has("state");
    if (hasBeenLogged) {
        await authClient.handleRedirectCallback();
        window.history.pushState({}, "", "/");
    }
}

async function isAuthenticated() {
    try {
        return authClient.isAuthenticated();
    } catch (error) {
        console.error(`Error trying to check if user is authenticated: ${error}`);
        authError.set(error);
    }
}

async function authenticate() {
    if (!authClient) await init();
    try {
        await handleRedirectionLogin();
        return isAuthenticated();
    } catch (error) {
        console.error(`Error trying to authenticate: ${error}`);
        authError.set(error);
    }
}

async function login(options = { usePopup: false }) {
    try {
        if (options.usePopup) {
            await authClient.loginWithPopup({ authorizationParams: { screen_hint: "login" } });
        } else {
            await authClient.loginWithRedirect({ authorizationParams: { screen_hint: "login" } });
        }
    } catch (error) {
        console.error(`Error trying to login: ${error}`);
        authError.set(error);
    }
}

async function signup(options = { usePopup: false }) {
    try {
        if (options.usePopup) {
            await authClient.loginWithPopup({ authorizationParams: { screen_hint: "signup" } });
        } else {
            await authClient.loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });
        }
    } catch (error) {
        console.error(`Error trying to login: ${error}`);
        authError.set(error);
    }
}

async function getUser(): Promise<{ name: string; email: string }> {
    try {
        return authClient?.getUser();
    } catch (error) {
        console.error(`Error getting user: ${error}`);
        authError.set(error);
    }
}

async function getAuthToken() {
    try {
        return authClient?.getTokenSilently();
    } catch (error) {
        console.error(`Error getting token: ${error}`);
        authError.set(error);
    }
}

async function logout() {
    try {
        authClient.logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
    } catch (error) {
        console.error(`Error trying to logout: ${error}`);
        authError.set(error);
    }
}

export default {
    authenticate,
    login,
    logout,
    isAuthenticated,
    signup,
    getUser,
    getAuthToken,
};
