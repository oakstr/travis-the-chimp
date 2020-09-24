import * as dotenv from 'dotenv';
import {join as joinPaths} from 'path';
import {AttributeType} from './lib/perspective-api';

dotenv.config({path: joinPaths(__dirname, '..', '.env')});

/** Token used to authenticate with the Discord API. */
export const discordToken = process.env.DISCORD_TOKEN;

/** Perspective API key. */
export const perspectiveApiKey = process.env.GOOGLE_API_KEY;

export const thresholds = {[AttributeType.Toxicity]: {ban: 0.80, kick: 0.70, delete: 0.50}};
