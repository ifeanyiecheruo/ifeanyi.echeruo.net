interface PromiseSuccessHandler<TValue, TResult, TError> {
    (value?: TValue): TResult;
}

interface PromiseFailureHandler<TError, TResult, TNextError> {
    (error?: TError): TResult;
}

interface ThenableVR<TResult, TError> {
    then<TNextResult>(success: PromiseSuccessHandler<TResult, TNextResult | ThenableVR<TNextResult, TError>, TError>): ThenableVR<TNextResult, TError>;
    then<TNextResult, TNextError>(success: PromiseSuccessHandler<TResult, TNextResult | ThenableVR<TNextResult, TNextError>, TNextError>): ThenableVR<TNextResult, TNextError>;

    catch(failure: PromiseFailureHandler<TError, TResult, TError>): ThenableVR<TResult, TError>;
    catch<TNextResult>(failure: PromiseFailureHandler<TError, TNextResult | ThenableVR<TNextResult, TError>, TError>): ThenableVR<TNextResult, TError>;
    catch<TNextResult, TNextError>(failure: PromiseFailureHandler<TError, TNextResult | ThenableVR<TNextResult, TNextError>, TNextError>): ThenableVR<TNextResult, TNextError>;
}

type Thenable = ThenableVR<any, any>
