import {perspectiveApiKey} from './config';
import {PerspectiveApi} from './lib/perspective-api';

if (perspectiveApiKey === undefined) {
	throw new TypeError('Expected perspectiveApiKey to be defined');
}

export const perspective = new PerspectiveApi(perspectiveApiKey);
