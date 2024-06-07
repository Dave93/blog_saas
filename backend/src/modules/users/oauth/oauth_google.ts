import { GoogleOauthUserData } from "./dtos/google";

export const getGoogleUserData = async (accessToken: string) => {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json() as GoogleOauthUserData;
        return {
            ...data,
            id: data.sub,
            login: data.email,
            avatar_url: data.picture,
        };
    } catch (error) {
        console.log('error', error);
        return null;
    }
};