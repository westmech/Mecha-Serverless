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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamMatches = exports.getMatches = exports.getCurrYear = exports.fetchYear = exports.test = void 0;
const axios_1 = __importDefault(require("axios"));
const options_1 = require("../../lib/options");
const errors_1 = __importDefault(require("../../lib/errors"));
const concat_pages_1 = require("../../lib/concat-pages");
const helpers_1 = require("./helpers");
const api_key = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzIiwianRpIjoiODVhM2ZmMTM4NmE4YjJhZWM5ZjE0ZWViZDE5ZmRjYmVlZjY0MDIzZDgzMTEwNzkxY2VmNmM1Mzg4NDA0ZjVmZGZmMDcxMGFjYjQ3OTJmYmQiLCJpYXQiOjE3MjE3ODYxNTEuNTUwNTQyMSwibmJmIjoxNzIxNzg2MTUxLjU1MDU0NTksImV4cCI6MjY2ODQ3NDU1MS41NDU2OTI5LCJzdWIiOiIxMzE3NzciLCJzY29wZXMiOltdfQ.dLmvsAfDyAIHsfKlFcBgd4M7KB7M0_6PUHvKJztb-O7r8jD1K8TH-uikxDLBKweoM1UV6mkPvgjaVYLbdLl9Oi_D6jeYwotvqzgurrjuwk18-7endYSyX82JuAk52fSLZdKnnqRGIifX4WC93CIL92M6mdNht52sb9FgBG1aVgOWu40-ZLCSKuRrMId5yiq3RBdj0snSOKMil-RMuhZ-fiEYTA-qS80PV84P8dp0ZVbN9_SwS1_U9OlanKlc8PXuY2xFx3oWStWrEEqmiFMifrknKGPyP4Y8neC9XUy3sWYX8jKP1O7ps2dAt_is90QWQXrTKZV41thQKzM3lxJvrHNvW8yTWZY8AqLsd0F5G64qvrKWUvW5f2Tooh4tZECl5mFiksUpukJ8lMDh2sCQsgOQrsK_msKJn07jTw-PQ3r4-pbMJVWi7AFkfLwtl3W9aHJlLpOKQFOTni3BkMM_q-_LaohOsbOSgpQJrsxHTgOheT5lg_GxrEM-NmeENsbUfHS1fRSV18A_dv8cGgA9fYwOAhbj4pjl8S9x86DfoajQpLrWHsPktGho1s5b88-dwK2dEtGn4rJyNzLot0uGU-2UcqAHc4h8t-iHFbEoZW1jHB9wAe23kh1VFkn8ner5xSxQL-Ii9IyLPGuGL7C1Tg097ipUo3mKpfsSYZdbbC0";
const test = () => __awaiter(void 0, void 0, void 0, function* () {
    return {
        statusCode: 200,
        body: JSON.stringify({ status: "OK" }),
    };
});
exports.test = test;
const fetchYear = (year, api_key) => __awaiter(void 0, void 0, void 0, function* () {
    if (!helpers_1.yearToKeyMap[year]) {
        return;
    }
    const id = helpers_1.yearToKeyMap[year];
    const response = yield axios_1.default.get(`https://www.robotevents.com/api/v2/events/${id}`, {
        headers: {
            Authorization: `Bearer ${api_key}`,
        },
    });
    const divisions = response.data.divisions;
    const divToKeyMap = divisions.reduce((acc, division) => {
        acc[division.name.toLowerCase()] = division.id;
        return acc;
    }, {});
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
});
exports.fetchYear = fetchYear;
// ─────────────────────────────────────────────────────────────────────────────
// Function: getCurrYear
// Example: GET /events/getYear
// ─────────────────────────────────────────────────────────────────────────────
const getCurrYear = (event, ctx, callback) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pathParams = event.queryStringParameters;
        const today = new Date();
        const rawYear = today.getFullYear();
        const currentYear = today.getMonth() > 4 ? rawYear + 1 : rawYear; // +1 if after May
        let selectedYear;
        if (!pathParams || !pathParams.year) {
            selectedYear = helpers_1.yearToKeyMap[currentYear.toString()]
                ? currentYear
                : currentYear - 1;
        }
        else {
            selectedYear = String(pathParams.year);
        }
        if (!helpers_1.yearToKeyMap[selectedYear]) {
            callback(null, {
                statusCode: 400,
                body: JSON.stringify({
                    error: `Invalid year. Valid years are: ${Object.keys(helpers_1.yearToKeyMap).join(", ")}`,
                }),
            });
            return;
        }
        const response = yield (0, exports.fetchYear)(String(selectedYear), api_key);
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
    }
    catch (error) {
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: error,
            }),
        });
    }
});
exports.getCurrYear = getCurrYear;
// ─────────────────────────────────────────────────────────────────────────────
// Function: getMatches
// ─────────────────────────────────────────────────────────────────────────────
const getMatches = (event, ctx, callback) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryParams = options_1.Options.fromNullable(event.queryStringParameters, errors_1.default.missingPathParamResponse("query", "year and division"))
            .map((params) => {
            if (!params.year || !params.division) {
                throw errors_1.default.missingPathParamResponse("query", "year or division");
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
        const matches = yield (0, concat_pages_1.concPagination)(url, api_key);
        callback(null, {
            statusCode: 200,
            body: JSON.stringify(matches),
        });
    }
    catch (error) {
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: error,
            }),
        });
    }
});
exports.getMatches = getMatches;
// ─────────────────────────────────────────────────────────────────────────────
// Function: streamMatches
// ─────────────────────────────────────────────────────────────────────────────
const streamMatches = (event, ctx, callback) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const queryParams = event.queryStringParameters || {};
        let req;
        try {
            req = (0, helpers_1.validateStreamMatchesQuery)(queryParams);
        }
        catch (validationError) {
            callback(null, {
                statusCode: validationError.statusCode || 400,
                body: JSON.stringify({ error: validationError.message }),
            });
            return;
        }
        const fetchEventString = yield (0, exports.fetchYear)(String(req.year), api_key);
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
        const url = `https://www.robotevents.com/api/v2/events/${helpers_1.yearToKeyMap[req.year]}/divisions/${divToKeyMap[req.division]}/matches?round%5B%5D=${currRound}`;
        const result = yield (0, concat_pages_1.paginationHelper)(url, params, api_key);
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
        }
        else {
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
    }
    catch (error) {
        console.error("Error in streamMatches:", error);
        callback(null, {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal Server Error",
            }),
        });
    }
});
exports.streamMatches = streamMatches;
//# sourceMappingURL=handler.js.map