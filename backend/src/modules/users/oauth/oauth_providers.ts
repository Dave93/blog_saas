import { GithubOauthUserData } from "./dtos/github";

export const getGithubUserData = async (accessToken: string) => {
    try {
        const response = await fetch('https://api.github.com/user', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json() as GithubOauthUserData;
        return data;
    } catch (error) {
        console.log('error', error);
        return null;
    }
};