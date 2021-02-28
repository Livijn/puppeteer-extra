export declare const PROVIDER_ID = "2captcha";
import * as types from '../types';
export interface DecodeRecaptchaAsyncResult {
    err?: any;
    result?: any;
    invalid?: any;
}
export declare function getSolutions(captchas?: types.CaptchaInfo[], token?: string, proxy?: string): Promise<types.GetSolutionsResult>;
