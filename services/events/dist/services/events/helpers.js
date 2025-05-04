"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMatches = exports.validateStreamMatchesQuery = exports.yearToKeyMap = void 0;
// utils/validateStreamMatchesQuery.ts
exports.yearToKeyMap = {
    "2023": "47800",
    "2024": "51496",
    "2025": "55504"
}; // UPDATE WITH EACH NEW YEAR
const validateStreamMatchesQuery = (params) => {
    const { year, division, currentPage, currentRoundIndex } = params;
    if (!year || !division || !currentPage || !currentRoundIndex) {
        throw {
            statusCode: 400,
            message: "Missing one or more required query parameters: year, division, currentPage, currentRoundIndex",
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
exports.validateStreamMatchesQuery = validateStreamMatchesQuery;
const transformMatches = (matches, year, division) => __awaiter(void 0, void 0, void 0, function* () {
    const transformedMatchesPromises = matches.map((match) => __awaiter(void 0, void 0, void 0, function* () {
        if (match !== undefined && match !== null) {
            const redAlliancePromises = match.alliances[1].teams.map((team) => ({ number: team.team.name }));
            const blueAlliancePromises = match.alliances[0].teams.map((team) => ({ number: team.team.name }));
            const redAlliance = yield Promise.all(redAlliancePromises);
            const blueAlliance = yield Promise.all(blueAlliancePromises);
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
    }));
    const transformedMatches = (yield Promise.all(transformedMatchesPromises)).filter((match) => match !== undefined);
    return transformedMatches;
});
exports.transformMatches = transformMatches;
//# sourceMappingURL=helpers.js.map