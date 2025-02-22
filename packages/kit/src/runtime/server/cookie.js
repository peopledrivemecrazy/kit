import { parse } from 'cookie';

/** @type {import('cookie').CookieSerializeOptions} */
const DEFAULT_SERIALIZE_OPTIONS = {
	httpOnly: true,
	secure: true,
	sameSite: 'lax'
};

/**
 * @param {Request} request
 * @param {URL} url
 */
export function get_cookies(request, url) {
	/** @type {Map<string, {name: string; value: string; options: import('cookie').CookieSerializeOptions;}>} */
	const new_cookies = new Map();

	/** @type {import('types').Cookies} */
	const cookies = {
		// The JSDoc param annotations appearing below for get, set and delete
		// are necessary to expose the `cookie` library types to
		// typescript users. `@type {import('types').Cookies}` above is not
		// sufficient to do so.

		/**
		 * @param {string} name
		 * @param {import('cookie').CookieParseOptions} opts
		 */
		get(name, opts) {
			const c = new_cookies.get(name);
			if (
				c &&
				domain_matches(url.hostname, c.options.domain) &&
				path_matches(url.pathname, c.options.path)
			) {
				return c.value;
			}

			const decode = opts?.decode || decodeURIComponent;
			const req_cookies = parse(request.headers.get('cookie') ?? '', { decode });
			return req_cookies[name]; // the decoded string or undefined
		},

		/**
		 * @param {string} name
		 * @param {string} value
		 * @param {import('cookie').CookieSerializeOptions} opts
		 */
		set(name, value, opts = {}) {
			new_cookies.set(name, {
				name,
				value,
				options: {
					...DEFAULT_SERIALIZE_OPTIONS,
					...opts
				}
			});
		},

		/**
		 * @param {string} name
		 * @param {import('cookie').CookieSerializeOptions} opts
		 */
		delete(name, opts = {}) {
			new_cookies.set(name, {
				name,
				value: '',
				options: {
					...DEFAULT_SERIALIZE_OPTIONS,
					...opts,
					maxAge: 0
				}
			});
		}
	};

	return { cookies, new_cookies };
}

/**
 * @param {string} hostname
 * @param {string} [constraint]
 */
export function domain_matches(hostname, constraint) {
	if (!constraint) return true;

	const normalized = constraint[0] === '.' ? constraint.slice(1) : constraint;

	if (hostname === normalized) return true;
	return hostname.endsWith('.' + normalized);
}

/**
 * @param {string} path
 * @param {string} [constraint]
 */
export function path_matches(path, constraint) {
	if (!constraint) return true;

	const normalized = constraint.endsWith('/') ? constraint.slice(0, -1) : constraint;

	if (path === normalized) return true;
	return path.startsWith(normalized + '/');
}
