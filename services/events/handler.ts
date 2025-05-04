import axios from "axios";
import { Options } from "../../lib/options";
import helpers from "../../lib/errors";
import { concPagination, paginationHelper } from "../../lib/concat-pages";
import {
    APIGatewayProxyEvent,
    Context,
    Callback,
    APIGatewayProxyResult,
} from "aws-lambda";
import { validateStreamMatchesQuery, yearToKeyMap } from "./helpers";

const api_key = process.env.ROBOTEVENTS_API_KEY || "";

interface ApiResponse<T> {
    data: {
        name: string;
        season: {
            name: string;
        };
        location: {
            address_1: string;
        };
        start_date: string;
        end_date: string;
        divisions: Array<{
            id: number;
            name: string;
        }>;
        ongoing: boolean;
        awards_finalized: boolean;
    };
}

export const test = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: "OK" }),
    };
};

export const fetchYear = async (year: string, api_key: string) => {
    if (!yearToKeyMap[year as keyof typeof yearToKeyMap]) {
        return;
    }

    const id = yearToKeyMap[year as keyof typeof yearToKeyMap];

    const response: ApiResponse<any> = await axios.get(
        `https://www.robotevents.com/api/v2/events/${id}`,
        {
            headers: {
                Authorization: `Bearer ${api_key}`,
            },
        }
    );

    const divisions = response.data.divisions;

    interface Division {
        id: number;
        name: string;
    }

    const divToKeyMap: Record<string, number> = divisions.reduce(
        (acc: Record<string, number>, division: Division) => {
            acc[division.name.toLowerCase()] = division.id;
            return acc;
        },
        {} as Record<string, number>
    );

    return JSON.stringify({
        year: year,
        id: id,
        name: response.data.name,
        season: response.data.season.name,
        venue: response.data.location.address_1,
        start_date: response.data.start_date,
        end_date: response.data.end_date,
        divisions: divToKeyMap,
        ongoing: response.data.ongoing,
        awards_finalized: response.data.awards_finalized,
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Function: getCurrYear
// Example: GET /events/getYear
// ─────────────────────────────────────────────────────────────────────────────

export const getCurrYear = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    try {
        const pathParams = event.queryStringParameters;
        const today = new Date();
        const rawYear = today.getFullYear();
        const currentYear = today.getMonth() > 4 ? rawYear + 1 : rawYear; // +1 if after May
        let selectedYear;

        if (!pathParams || !pathParams.year) {
            selectedYear = yearToKeyMap[currentYear.toString()]
                ? currentYear
                : currentYear - 1;
        } else {
            selectedYear = String(pathParams.year);
        }

        if (!yearToKeyMap[selectedYear as keyof typeof yearToKeyMap]) {
            callback(null, {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Invalid year. Valid years are: ${Object.keys(
                        yearToKeyMap
                    ).join(", ")}`,
                }),
            });
            return;
        }
        
        const response = await fetchYear(String(selectedYear), api_key);

        if (!response) {
            callback(null, {
                statusCode: 404,
                body: JSON.stringify({
                    error: `No event found for year ${selectedYear}`,
                }),
            });
            return;
        }

        callback(null, {
            statusCode: 200,
            body: response
        });

    } catch (error) {
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: error,
            }),
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Function: getMatches
// ─────────────────────────────────────────────────────────────────────────────

export const getMatches = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    try {
        const queryParams = Options.fromNullable(
            event.queryStringParameters,
            helpers.missingPathParamResponse("query", "year and division")
        )
            .map((params) => {
                if (!params.year || !params.division) {
                    throw helpers.missingPathParamResponse(
                        "query",
                        "year or division"
                    );
                }
                return {
                    year: params.year,
                    division: params.division,
                };
            })
            .orElse((error) => {
                throw error;
            });

        const { year, division } = queryParams.unwrap();

        const url = `https://www.robotevents.com/api/v2/events/55504/divisions/1/matches?round%5B%5D=2`;

        const matches = await concPagination(url, api_key);

        callback(null, {
            statusCode: 200,
            body: JSON.stringify(matches),
        });
    } catch (error) {
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: error,
            }),
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Function: streamMatches
// ─────────────────────────────────────────────────────────────────────────────

export const streamMatches = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    try {
        const queryParams = event.queryStringParameters || {};
        let req;

        try {
            req = validateStreamMatchesQuery(queryParams as any);
        } catch (validationError: any) {
            callback(null, {
                statusCode: validationError.statusCode || 400,
                body: JSON.stringify({ error: validationError.message }),
            });
            return;
        }

        const fetchEventString = await fetchYear(String(req.year), api_key);
        const fetchEvent = fetchEventString ? JSON.parse(fetchEventString) : null;

        if (!fetchEvent || !fetchEvent.divisions) {
            callback(null, {
                statusCode: 404,
                body: JSON.stringify({
                    error: `No event found for year ${req.year}`,
                }),
            });
            return;
        }

        const divToKeyMap = fetchEvent.divisions;


        const orderOfIteration = [1, 2, 6, 3, 4, 5];
        const currRound = orderOfIteration[req.currentRoundIndex];
        const params = {
            page: req.currentPage,
            per_page: 10,
        };

        const url = `https://www.robotevents.com/api/v2/events/${yearToKeyMap[req.year]}/divisions/${divToKeyMap[req.division]}/matches?round%5B%5D=${currRound}`;

        const result = await paginationHelper(url, params, api_key);

        if (!result) {
            callback(null, {
                statusCode: 500,
                body: JSON.stringify({
                    error: "Failed to fetch pagination data",
                }),
            });
            return;
        }
        const { metadata, data } = result;

        const matches = data;

        let nextPage = req.currentPage;
        let nextRoundIndex = req.currentRoundIndex;
        let reachedEndOfMatches = false;

        if (metadata.current_page < metadata.last_page) {
            nextPage++;
        } else {
            nextRoundIndex++;
            nextPage = 1;

            if (nextRoundIndex >= orderOfIteration.length) {
                reachedEndOfMatches = true;
            }
        }

        const matchesArr = [];

        if (matches) {
            for (const match of matches) {
                if (match) {
                     matchesArr.push(match);
                }
            }
        }

        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                data: matchesArr,
                nextPage,
                nextRoundIndex,
                reachedEndOfMatches,
            }),
        });
    } catch (error) {
        console.error("Error in streamMatches:", error);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
            }),
        });
    }
};
