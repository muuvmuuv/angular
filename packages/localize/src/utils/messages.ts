/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {PLACEHOLDER_NAME_MARKER} from './constants';
import {TranslationKey} from './translations';

/**
 * A string containing a translation source message.
 *
 * I.E. the message that indicates what will be translated from.
 *
 * Uses `{$placeholder-name}` to indicate a placeholder.
 */
export type SourceMessage = string;

/**
 * Information parsed from a `$localize` tagged string that is used to translate it.
 *
 * For example:
 *
 * ```
 * const name = 'Jo Bloggs';
 * $localize`Hello ${name}:title!`;
 * ```
 *
 * May be parsed into:
 *
 * ```
 * {
 *   translationKey: 'Hello {$title}!',
 *   substitutions: { title: 'Jo Bloggs' },
 * }
 * ```
 */
export interface ParsedMessage {
  /**
   * The key used to look up the appropriate translation target.
   */
  translationKey: TranslationKey;
  /**
   * A mapping of placeholder names to substitution values.
   */
  substitutions: Record<string, any>;
}

/**
 * Parse a `$localize` tagged string into a structure that can be used for translation.
 *
 * See `ParsedMessage` for an example.
 */
export function parseMessage(
    messageParts: TemplateStringsArray, expressions: readonly any[]): ParsedMessage {
  const replacements: {[placeholderName: string]: any} = {};
  let translationKey = messageParts[0];
  for (let i = 1; i < messageParts.length; i++) {
    const messagePart = messageParts[i];
    const expression = expressions[i - 1];
    // There is a problem with synthesizing template literals in TS.
    // It is not possible to provide raw values for the `messageParts` and TS is not able to compute
    // them since this requires access to the string in its original (non-existent) source code.
    // Therefore we fall back on the non-raw version if the raw string is empty.
    // This should be OK because synthesized nodes only come from the template compiler and they
    // will always contain placeholder name information.
    // So there will be no escaped placeholder marker character (`:`) directly after a substitution.
    if ((messageParts.raw[i] || messagePart).charAt(0) === PLACEHOLDER_NAME_MARKER) {
      const endOfPlaceholderName = messagePart.indexOf(PLACEHOLDER_NAME_MARKER, 1);
      const placeholderName = messagePart.substring(1, endOfPlaceholderName);
      translationKey += `{$${placeholderName}}${messagePart.substring(endOfPlaceholderName + 1)}`;
      replacements[placeholderName] = expression;
    } else {
      const placeholderName = `ph_${i}`;
      translationKey += `{$${placeholderName}}${messagePart}`;
      replacements[placeholderName] = expression;
    }
  }
  return {translationKey, substitutions: replacements};
}
