import {
    APIGatewayProxyEvent,
    Context,
    Callback,
    APIGatewayProxyResult,
} from "aws-lambda";
import { yearToKeyMap } from "../../lib/years";
import axios, { AxiosResponse } from "axios";
import dotenv from "dotenv";
import path from "path";
import { transformAwards } from "./helpers";

const envPath = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: envPath });
const api_key = process.env.ROBOTEVENTS_API_KEY || "";

export const test = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: "OK" }),
    };
};

export const getAwards = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    const year = event.pathParameters?.year;
    if (!year) {
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({ error: "Year is required" }),
        });
        return;
    }

    if (!yearToKeyMap[year] || yearToKeyMap[year] === undefined) {
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid year" }),
        });
        return;
    }

    const url = `https://www.robotevents.com/api/v2/events/${yearToKeyMap[year]}/awards`;

    const response: AxiosResponse<any> = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${api_key}`,
        },
    });

    const transformedAwards = await transformAwards(response.data.data, parseInt(year, 10));

    callback(null, {
        statusCode: 200,
        body: JSON.stringify(transformedAwards),
    });
};
