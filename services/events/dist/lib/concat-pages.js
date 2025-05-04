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
exports.paginationHelper = void 0;
exports.concPagination = concPagination;
const axios_1 = __importDefault(require("axios"));
const removeDuplicates = (array) => {
    const uniqueSet = new Set(array.map((item) => JSON.stringify(item)));
    return Array.from(uniqueSet).map((item) => JSON.parse(item));
};
const paginationHelper = (url, params, api_key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${api_key}`,
            },
            params: params,
        });
        const metadata = response.data.meta;
        let data = response.data.data;
        data = data.filter((item) => item !== undefined);
        data = removeDuplicates(data);
        return { metadata, data };
    }
    catch (error) {
        console.error("Error fetching info from API:", error);
    }
});
exports.paginationHelper = paginationHelper;
// recursively concatenates paginated API results and removes duplicates
function concPagination(url, api_key) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (url !== null) {
                const response = yield axios_1.default.get(url, {
                    headers: {
                        Authorization: `Bearer ${api_key}`,
                    },
                });
                const resMeta = response.data.meta;
                const resData = response.data.data;
                let concatenatedData = resData.concat(yield concPagination(resMeta.next_page_url, api_key));
                concatenatedData = concatenatedData.filter((item) => item !== undefined);
                concatenatedData = removeDuplicates(concatenatedData);
                return concatenatedData;
            }
            return [];
        }
        catch (error) {
            console.error("Error fetching info from API:", error);
            return [];
        }
    });
}
//# sourceMappingURL=concat-pages.js.map