import * as highlight from 'highlight.js';
import * as _ from 'lodash';
import * as markdownIt from 'markdown-it';

export const markdown = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang === 'tsx') {
      lang = 'jsx';
    }

    if (lang === 'typescript') {
      lang = 'javascript';
    }

    if (lang && highlight.getLanguage(lang)) {
      try {
        return highlight.highlight(lang, str).value;
      } catch (__) {
        //
      }
    }

    return '';
  }
});
