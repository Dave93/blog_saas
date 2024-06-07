import { GithubOauthUserData, GithubUserEmailData } from "./dtos/github";

export const getGithubUserData = async (accessToken: string) => {
    try {
        const response = await fetch('https://api.github.com/user', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const data = await response.json() as GithubOauthUserData;
        const emailResponse = await fetch('https://api.github.com/user/emails', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const emailData = await emailResponse.json() as GithubUserEmailData[];
        let email = '';
        if (emailData && emailData.length) {
            email = emailData[0].email;
        }
        return {
            ...data,
            email,
        };
    } catch (error) {
        console.log('error', error);
        return null;
    }
};