import got from 'got';
import {PartialDeep, RequireAtLeastOne} from 'type-fest';

export enum AttributeType {
	Toxicity = 'TOXICITY',
	SevereToxicity = 'SEVERE_TOXICITY',
	ToxicityFast = 'TOXICITY_FAST',
	IdentityAttack = 'IDENTITY_ATTACK',
	IdentityAttackExperimental = 'IDENTITY_ATTACK_EXPERIMENTAL',
	Insult = 'INSULT',
	InsultExperimental = 'INSULT_EXPERIMENTAL',
	Profanity = 'PROFANITY',
	ProfanityExperimental = 'PROFANITY_EXPERIMENTAL',
	Threat = 'THREAT',
	ThreatExperimental = 'THREAT_EXPERIMENTAL',
	SexuallyExplicit = 'SEXUALLY_EXPLICIT',
	Flirtation = 'FLIRTATION'
}

export enum Language {
	English = 'en',
	Spanish = 'es',
	French = 'fr',
	German = 'de',
	Portugese = 'pt',
	Italian = 'it',
	Russian = 'ru'
}

export enum ScoreType {
	Probability = 'PROBABILITY'
}

export enum CommentType {
	PlainText = 'PLAIN_TEXT',
	Html = 'HTML'
}

export interface Attribute {
	scoreType: string;
	scoreThreshold: number;
}

export type RequestedAttributes<T extends AttributeType> = RequireAtLeastOne<PartialDeep<Record<T, Partial<Attribute>>>>;

export interface AnalyzeCommentRequest<T extends AttributeType> {
	comment: {
		/**
		 * The text to score.
		 * This is assumed to be utf8 raw text of the text to be checked.
		 * Emoji and other non-ascii characters can be included (HTML will probably result in lower performance).
		 */
		text: string;
		/**
		 * The text type of `comment.text`.
		 * Either `"PLAIN_TEXT"` or `"HTML"`.
		 * Currently only `"PLAIN_TEXT"` is supported.
		 */
		type?: CommentType;
	};
	context?: {
		/**
		 * A list of objects providing the context for `comment`.
		 * Currently not supported by the API.
		 */
		entries: {text: string; type: string};
	};
	/**
	 * A map from attribute name to a configuration object.
	 * See the [attributes section](https://github.com/conversationai/perspectiveapi/blob/master/2-api/models.md#all-attribute-types) for a list of available attribute names.
	 * If no configuration options are specified, defaults are used, so the empty object `{}` is a valid (and common) choice.
	 * You can specify multiple attribute names here to get scores from multiple attributes in a single request.
	 */
	requestedAttributes: RequestedAttributes<T>;
	/**
	 * A boolean value that indicates if the request should return spans that describe the scores for each part of the text (currently done at per-sentence level).
	 * Defaults to `false`.
	 */
	spanAnnotations?: string;
	/**
	 * A list of ISO 631-1 two-letter language codes specifying the language(s) that comment is in (for example, `"en"`, `"es"`, `"fr"`, `"de"`, etc).
	 * If unspecified, the API will auto-detect the comment language.
	 * If language detection fails, the API returns an error.
	 * Note: You can find languages currrently supported here.
	 * There is no simple way to use the API across languages with production support and languages with experimental support only.
	 */
	languages?: Language[];
	/**
	 * Whether the API is permitted to store `comment` and `context` from this request.
	 * Stored comments will be used for future research and community attribute building purposes to improve the API over time. We also plan to provide dashboards and automated analysis of the comments submitted, which will apply only to those stored.
	 * Defaults to false (request data may be stored).
	 *
	 * **Warning**: This should be set to true if data being submitted is private (i.e. not publicly accessible), or if the data submitted contains content written by someone under 13 years old.
	 */
	doNotStore?: boolean;
	/**
	 * An opaque token that is echoed back in the response.
	 */
	clientToken?: string;
	/**
	 * An opaque session ID. This should be set for authorship experiences by the client side so that groups of requests can be grouped together into a session.
	 * This should not be used for any user-specific id.
	 * This is intended for abuse protection and individual sessions of interaction.
	 */
	sessionId?: string;
	/**
	 * Used to notify the Perspective API team of specific biases, in order to help us improve our attribute.
	 * Many kinds of toxic language are disproportionately represented in our dataset, which leads to some obviously incorrect scores, as well as unintended biases.
	 * Use this method to help us correct them.
	 */
	suggestCommentScore?: string;
}

export interface AnalyzeCommentResponse<T extends AttributeType> {
	/**
	 * A map from attribute name to per-attribute score objects.
	 * The attribute names will mirror the request's `requestedAttributes`.
	 */
	attributeScores: Record<
		T,
		{
			summaryScore: {
				/**
				 * The attribute summary score for the entire comment.
				 * All attributes will return a `summaryScore` (unless the request specified a `scoreThreshold` for the attribute that the `summaryScore` did not exceed).
				 */
				value: number;
				/**
				 * This mirrors the requested `scoreType` for this attribute.
				 */
				type: ScoreType;
			};
			/**
			 * A list of per-span scores for this attribute.
			 * These scores apply to different parts of the request's comment.text.
			 *
			 * **Note**: Some attributes may not return `spanScores` at all.
			 */
			spanScores: [
				{
					/** Beginning of the text span in the request comment. */
					begin: number;
					/** End of the text span in the request comment. */
					end: number;
					score: {
						/** The attribute score for the span delimited by `begin` and `end`. */
						value: number;
						/** Same as `summaryScore.type`. */
						type: ScoreType;
					};
				}
			];
		}
	>;
	/**
	 * Mirrors the request's languages.
	 * If no languages were specified, the API returns the auto-detected language.
	 */
	languages: string[];
	/**
	 * Mirrors the request's `clientToken`.
	 */
	clientToken: string;
}

/**
 * Interface with the Perspective API.
 */
export class PerspectiveApi {
	constructor(private readonly key: string) {}

	async analyzeComment<T extends AttributeType>(options: {
		comment: {text: string; type: CommentType};
		languages?: Language[];
		requestedAttributes: RequestedAttributes<T>;
	}) {
		const body: AnalyzeCommentRequest<T> = {
			comment: {text: options.comment.text, type: options.comment.type},
			languages: options.languages,
			requestedAttributes: options.requestedAttributes
		};

		const request = got<AnalyzeCommentResponse<T>>('https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze', {
			method: 'post',
			json: body,
			searchParams: {key: this.key},
			responseType: 'json'
		});
		const response = await request;

		return response.body;
	}
}
