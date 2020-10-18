import * as dotenv from 'dotenv';
import path from 'path';
import {AttributeType} from './lib/perspective-api';

dotenv.config({path: path.join(__dirname, '..', '.env')});

/** Token used to authenticate with the Discord API. */
export const discordToken = process.env.DISCORD_TOKEN;

/** Perspective API key. */
export const perspectiveApiKey = process.env.GOOGLE_API_KEY;

export const thresholds = {[AttributeType.Toxicity]: {ban: 0.8, kick: 0.7, delete: 0.5}};
