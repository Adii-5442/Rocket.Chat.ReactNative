import React, { ReactElement } from 'react';

import { useMessageComposerState } from '../../context';
import { Markdown } from './Markdown';
import { Default } from './Default';
import { EmojiKeyboard } from './EmojiKeyboard';

export const Toolbar = (): ReactElement | null => {
	console.count('[MessageComposer] Toolbar');
	const { focused, showEmojiKeyboard, showEmojiSearchbar, showMarkdownToolbar } = useMessageComposerState();

	if (showEmojiSearchbar) {
		return null;
	}

	if (showEmojiKeyboard) {
		return <EmojiKeyboard />;
	}

	if (!focused) {
		return null;
	}

	if (showMarkdownToolbar) {
		return <Markdown />;
	}

	return <Default />;
};
