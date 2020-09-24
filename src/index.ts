import {convert} from 'convert';
import {Client} from 'discord.js';
import * as pkg from '../package.json';
import {discordToken} from './config';
import {onMessage} from './events/message';
import {logger} from './logger';

const {version} = pkg;

logger.info('version', version);
logger.info('Node.js version', process.versions.node);

if (discordToken === undefined) {
	throw new TypeError('Expected discordToken to be defined');
}

const client = new Client({
	disableMentions: 'everyone',

	presence: {activity: {type: 'WATCHING', name: 'you'}},

	messageCacheLifetime: convert(30).from('minutes').to('seconds'),
	messageSweepInterval: convert(1).from('minutes').to('seconds'),
	messageCacheMaxSize: 10
});

client
	.on('message', onMessage)
	.on('error', error => logger.error(error))
	.on('warn', info => logger.warn(info))
	.on('debug', info => logger.silly(info))
	.on('ready', () => logger.info('ready'));

process.on('unhandledRejection', error => logger.error(error));
process.on('uncaughtException', error => logger.error(error));

client
	.login(discordToken)
	.then(() => logger.info('logged in to Discord'))
	.catch(error => logger.fatal('an error occurred while logging in to Discord', error));
