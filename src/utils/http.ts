import { requestAsync } from "api";

export const get = async (options: RequestAsyncRequest & { Method?: undefined }) =>
	requestAsync({
		...options,
		Method: "GET",
	});

export const post = async (options: RequestAsyncRequest & { Method: undefined }) =>
	requestAsync({
		...options,
		Method: "POST",
	});

export const request = async (options: RequestAsyncRequest) => requestAsync(options);

export const requestStrict = async (options: RequestAsyncRequest) => {
	const response = await requestAsync(options);
	assert(response.Success, `HTTP ${response.StatusCode}: ${response.StatusMessage}`);
	return response;
};
