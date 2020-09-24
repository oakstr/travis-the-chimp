import {Message} from 'discord.js';
import {thresholds} from '../config';
import {AttributeType, CommentType} from '../lib/perspective-api';
import {logger} from '../logger';
import {perspective} from '../perspective-api';

/* eslint-disable max-depth */

/**
 * Emitted whenever a message is created.
 * @param message The created message
 */
export async function onMessage(message: Message): Promise<void> {
	if (message.content.length !== 0 && message.member?.roles.cache.size === 1) {
		const analysis = await perspective.analyzeComment<AttributeType.Toxicity>({
			comment: {text: message.content, type: CommentType.PlainText},
			requestedAttributes: {[AttributeType.Toxicity]: {}}
		});

		logger.debug({
			message: {content: message.content, id: message.id},
			author: {tag: message.author.tag, id: message.author.id},
			analysis: analysis.attributeScores
		});

		for (const [_key, value] of Object.entries(analysis.attributeScores)) {
			const key = _key as keyof typeof analysis.attributeScores;
			const {value: score} = value.summaryScore;

			/** The thresholds for this metric. */
			const threshold = thresholds[key];

			for (const [_punishment, minimumScore] of Object.entries(threshold)) {
				const punishment = _punishment as keyof typeof threshold;

				if (minimumScore <= score) {
					/** The reason used on Discord for automated moderation actions. */
					const reason = `Message was scored ${Math.round(score * 100)}% for ${key}`;

					/* eslint-disable no-await-in-loop */
					switch (punishment) {
						case 'ban':
							try {
								await message.member.ban({days: 1, reason});
							} catch (error) {
								logger.error(`unable to ban the user ${message.author.tag} (${message.author.id})`, error);
							}

							break;
						case 'kick':
							try {
								await message.member.kick(reason);
							} catch (error) {
								logger.error(`unable to kick the user ${message.author.tag} (${message.author.id})`, error);
							}

							break;
						case 'delete':
							try {
								await message.delete({reason});
							} catch (error) {
								logger.error(`unable to delete the message ${message.id} by the user ${message.author.tag} (${message.author.id})`, error);
							}

							break;
						default:
							throw new TypeError('Default condition for switch statement was reached, this should never happen');
					}

					break;
				}
			}
		}
	}
}
/* eslint-enable max-depth */
/* eslint-enable no-await-in-loop */
