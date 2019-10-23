interface FetchResponse {
    ok: boolean;
    status: number;
    statusText: string;
    json<T>(): ThenableVR<T, Error>;
    text(): ThenableVR<string, Error>;
}
