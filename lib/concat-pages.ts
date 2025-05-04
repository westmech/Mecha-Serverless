import axios from "axios";

interface MetaData {
    next_page_url: string | null;
    current_page: number;
    last_page: number;
}

interface ApiResponse<T> {
    data: {
        meta: MetaData;
        data: T[];
    };
}

const removeDuplicates = (array: any[]) => {
    const uniqueSet = new Set(array.map((item) => JSON.stringify(item)));
    return Array.from(uniqueSet).map((item) => JSON.parse(item));
};

const paginationHelper = async (
    url: string,
    params: Record<string, any>,
    api_key: string
): Promise<{ metadata: MetaData; data: any[] } | undefined> => {
    try {
        const response: ApiResponse<any> = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${api_key}`,
            },
            params: params,
        });
        const metadata: MetaData = response.data.meta;
        let data: any[] = response.data.data;

        data = data.filter((item) => item !== undefined);
        data = removeDuplicates(data);

        return { metadata, data };
    } catch (error) {
        console.error("Error fetching info from API:", error);
    }
};

// recursively concatenates paginated API results and removes duplicates
async function concPagination(
    url: string | null,
    api_key: string
): Promise<any[]> {
    try {
        if (url !== null) {
            const response: ApiResponse<any> = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${api_key}`,
                },
            });

            const resMeta = response.data.meta;
            const resData = response.data.data;

            let concatenatedData = resData.concat(
                await concPagination(resMeta.next_page_url, api_key)
            );
            concatenatedData = concatenatedData.filter(
                (item: any | undefined): item is any => item !== undefined
            );
            concatenatedData = removeDuplicates(concatenatedData);

            return concatenatedData;
        }
        return [];
    } catch (error) {
        console.error("Error fetching info from API:", error);
        return [];
    }
}

export { paginationHelper, concPagination };
