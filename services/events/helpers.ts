// utils/validateStreamMatchesQuery.ts
type StreamMatchesParams = {
    year: string;
    division: string;
    currentPage: string;
    currentRoundIndex: string;
};

type ParsedParams = {
    year: string;
    division: string;
    currentPage: number;
    currentRoundIndex: number;
};

export const validateStreamMatchesQuery = (
    params: StreamMatchesParams
): ParsedParams | never => {
    const { year, division, currentPage, currentRoundIndex } = params;

    if (!year || !division || !currentPage || !currentRoundIndex) {
        throw {
            statusCode: 400,
            message:
                "Missing one or more required query parameters: year, division, currentPage, currentRoundIndex",
        };
    }

    const parsedPage = Number(currentPage);
    const parsedRound = Number(currentRoundIndex);

    if (isNaN(parsedPage) || parsedPage <= 0) {
        throw {
            statusCode: 400,
            message: "Invalid currentPage. Must be a positive number.",
        };
    }

    if (isNaN(parsedRound) || parsedRound < 0 || parsedRound > 5) {
        throw {
            statusCode: 400,
            message: "Invalid currentRoundIndex. Valid values are 0–5.",
        };
    }

    return {
        year,
        division,
        currentPage: parsedPage,
        currentRoundIndex: parsedRound,
    };
};

interface Team {
    team: {
        name: string;
    };
}

interface Alliance {
    teams: Team[];
    score: number;
}

interface Match {
    name: string;
    alliances: [Alliance, Alliance];
}

export const transformMatches = async (
    matches: Match[],
    year: string,
    division: string
): Promise<
    {
        isLive: boolean;
        matchNumber: string;
        matchType: string;
        broadcast: string;
        division: string;
        status: string;
        season: string;
        redScore: number;
        blueScore: number;
        redAlliance: { number: string }[];
        blueAlliance: { number: string }[];
    }[]
> => {
    const transformedMatchesPromises = matches.map(async (match) => {
        if (match !== undefined && match !== null) {
            const redAlliancePromises = match.alliances[1].teams.map(
                (team) => ({ number: team.team.name })
            );

            const blueAlliancePromises = match.alliances[0].teams.map(
                (team) => ({ number: team.team.name })
            );

            const redAlliance = await Promise.all(redAlliancePromises);
            const blueAlliance = await Promise.all(blueAlliancePromises);

            return {
                isLive: false,
                matchNumber: match.name,
                matchType: division === "finals" ? "BEST OF 3" : "BEST OF 1",
                broadcast: "HS",
                division: division,
                status: "completed",
                season: year,
                redScore: match.alliances[1].score,
                blueScore: match.alliances[0].score,
                redAlliance: redAlliance,
                blueAlliance: blueAlliance,
            };
        }
    });

    const transformedMatches = (
        await Promise.all(transformedMatchesPromises)
    ).filter(
        (
            match
        ): match is {
            isLive: boolean;
            matchNumber: string;
            matchType: string;
            broadcast: string;
            division: string;
            status: string;
            season: string;
            redScore: number;
            blueScore: number;
            redAlliance: { number: string }[];
            blueAlliance: { number: string }[];
        } => match !== undefined
    );

    return transformedMatches;
};