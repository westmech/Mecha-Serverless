import {
    APIGatewayProxyEvent,
    Context,
    Callback,
    APIGatewayProxyResult,
} from "aws-lambda";
import { yearToKeyMap } from "../../lib/years";
import dotenv from "dotenv";
import path from "path";
import axios from "axios";

// Construct the path to your .env file
const envPath = path.resolve(__dirname, '../../../../.env');

dotenv.config({ path: envPath });

export const test = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: "OK" }),
    };
};

export const getOneTeam = async (
    event: APIGatewayProxyEvent,
    ctx: Context,
    callback: Callback<APIGatewayProxyResult>
) => {
    const id = event.pathParameters!.id;
    const years = Object.keys(yearToKeyMap).reverse();
    try {
        for (const year of years) {
            const url = `https://www.robotevents.com/api/v2/events/${yearToKeyMap[year]}/teams?number%5B%5D=${id}&myTeams=false`;
            const response = await axios.get(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${process.env.ROBOTEVENTS_API_KEY}`,
                },
            });

            if (response.data.data.length > 0) {
                const team = response.data.data[0];
                console.log(team);
                callback(null, {
                    statusCode: 200,
                    body: JSON.stringify({
                        name: team.team_name,
                        number: team.number,
                        robot_name: team.robot_name,
                        organization: team.organization,
                        location:`${team.location.city} ${team.location.region} ${team.location.country}`,
                        grade: team.grade,
                    }),
                });
            }
        }
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Team not found" }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
              error: error,
          }),
        };
    }
};

export const getAllTeams = async () => {
  return {
      statusCode: 200,
      body: JSON.stringify({ status: "OK" }),
  };
};