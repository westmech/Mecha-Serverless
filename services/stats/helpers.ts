const { getTeamInfo } = require("../req/getTeamInfo");

interface TeamInfo {
    number: number;
    name: string;
    affiliation: string;
    location: string;
}

interface TeamWinner {
    team: {
        name: string;
    };
}

interface Award {
    title: string;
    teamWinners: TeamWinner[];
}

export const transformAwards = async (
    awards: Award[],
    year: number
): Promise<
    {
        award: string;
        team: number;
        name: string;
        affiliation: string;
        location: string;
    }[]
> => {
    const transformedAwardsPromises = awards.map(async (award) => {
        const teamInfoPromises = award.teamWinners.map(async (teamWinner) => {
            const teamInfo: TeamInfo = await getTeamInfo(
                teamWinner.team.name,
                year
            );
            return {
                award: award.title.replace(/\s*\(.*?\)/, ""),
                team: teamInfo.number,
                name: teamInfo.name,
                affiliation: teamInfo.affiliation,
                location: teamInfo.location,
            };
        });
        return Promise.all(teamInfoPromises);
    });

    const transformedAwards = await Promise.all(transformedAwardsPromises);
    return transformedAwards.flat();
};
