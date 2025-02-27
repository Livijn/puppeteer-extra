"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HcaptchaContentScript = exports.ContentScriptDefaultData = exports.ContentScriptDefaultOpts = void 0;
exports.ContentScriptDefaultOpts = {
    visualFeedback: true,
};
exports.ContentScriptDefaultData = {
    solutions: [],
};
/**
 * Content script for Hcaptcha handling (runs in browser context)
 * @note External modules are not supported here (due to content script isolation)
 */
class HcaptchaContentScript {
    constructor(opts = exports.ContentScriptDefaultOpts, data = exports.ContentScriptDefaultData) {
        this.baseUrl = 'https://assets.hcaptcha.com/captcha/v1/';
        this.opts = opts;
        this.data = data;
    }
    async _waitUntilDocumentReady() {
        return new Promise(function (resolve) {
            if (!document || !window)
                return resolve(null);
            const loadedAlready = /^loaded|^i|^c/.test(document.readyState);
            if (loadedAlready)
                return resolve(null);
            function onReady() {
                resolve(null);
                document.removeEventListener('DOMContentLoaded', onReady);
                window.removeEventListener('load', onReady);
            }
            document.addEventListener('DOMContentLoaded', onReady);
            window.addEventListener('load', onReady);
        });
    }
    _paintCaptchaBusy($iframe) {
        try {
            if (this.opts.visualFeedback) {
                $iframe.style.filter = `opacity(60%) hue-rotate(400deg)`; // violet
            }
        }
        catch (error) {
            // noop
        }
        return $iframe;
    }
    /** Regular checkboxes */
    _findRegularCheckboxes() {
        const nodeList = document.querySelectorAll(`iframe[src^='${this.baseUrl}'][data-hcaptcha-widget-id]:not([src*='invisible'])`);
        return Array.from(nodeList);
    }
    /** Find active challenges from invisible hcaptchas */
    _findActiveChallenges() {
        const nodeList = document.querySelectorAll(`div[style*='visible'] iframe[src^='${this.baseUrl}'][src*='hcaptcha-challenge.html'][src*='invisible']`);
        return Array.from(nodeList);
    }
    _extractInfoFromIframes(iframes) {
        return iframes
            .map((el) => el.src.replace('.html#', '.html?'))
            .map((url) => {
            const { searchParams } = new URL(url);
            const result = {
                _vendor: 'hcaptcha',
                url: document.location.href,
                id: searchParams.get('id'),
                sitekey: searchParams.get('sitekey'),
                display: {
                    size: searchParams.get('size') || 'normal',
                },
            };
            return result;
        });
    }
    async findRecaptchas() {
        const result = {
            captchas: [],
            error: null,
        };
        try {
            await this._waitUntilDocumentReady();
            const iframes = [
                ...this._findRegularCheckboxes(),
                ...this._findActiveChallenges(),
            ];
            if (!iframes.length) {
                return result;
            }
            result.captchas = this._extractInfoFromIframes(iframes);
            iframes.forEach((el) => {
                this._paintCaptchaBusy(el);
            });
        }
        catch (error) {
            result.error = error;
            return result;
        }
        return result;
    }
    async enterRecaptchaSolutions() {
        const result = {
            solved: [],
            error: null,
        };
        try {
            await this._waitUntilDocumentReady();
            const solutions = this.data.solutions;
            if (!solutions || !solutions.length) {
                result.error = 'No solutions provided';
                return result;
            }
            result.solved = solutions
                .filter((solution) => solution._vendor === 'hcaptcha')
                .filter((solution) => solution.hasSolution === true)
                .map((solution) => {
                window.postMessage(JSON.stringify({
                    id: solution.id,
                    label: 'challenge-closed',
                    source: 'hcaptcha',
                    contents: {
                        event: 'challenge-passed',
                        expiration: 120,
                        response: solution.text,
                    },
                }), '*');
                return {
                    _vendor: solution._vendor,
                    id: solution.id,
                    isSolved: true,
                    solvedAt: new Date(),
                };
            });
        }
        catch (error) {
            result.error = error;
            return result;
        }
        return result;
    }
}
exports.HcaptchaContentScript = HcaptchaContentScript;
//# sourceMappingURL=content-hcaptcha.js.map