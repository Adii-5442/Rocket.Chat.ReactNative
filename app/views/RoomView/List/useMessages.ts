import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Subscription } from 'rxjs';

import { TAnyMessageModel, TThreadModel } from '../../../definitions';
import database from '../../../lib/database';
import { getThreadById } from '../../../lib/database/services/Thread';
import { animateNextTransition, compareServerVersion, useDebounce } from '../../../lib/methods/helpers';
import { QUERY_SIZE } from './constants';
import { Services } from '../../../lib/services';

export const useMessages = ({
	rid,
	tmid,
	showMessageInMainThread,
	serverVersion,
	hideSystemMessages
}: {
	rid: string;
	tmid?: string;
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	hideSystemMessages: string[];
}) => {
	console.count(`useMessages ${rid} ${tmid}`);
	const [messages, setMessages] = useState<TAnyMessageModel[]>([]);
	const thread = useRef<TThreadModel | null>(null);
	const count = useRef(0);
	const subscription = useRef<Subscription | null>(null);
	const messagesIds = useRef<string[]>([]);
	messagesIds.current = messages.map(m => m.id);

	const fetchMessages = useCallback(async () => {
		console.count(`useMessages fetchMessages ${rid} ${tmid}`);
		unsubscribe();
		count.current += QUERY_SIZE;

		if (!rid) {
			return;
		}

		const db = database.active;
		let observable;
		if (tmid) {
			if (!thread.current) {
				thread.current = await getThreadById(tmid);
			}
			observable = db
				.get('thread_messages')
				.query(Q.where('rid', tmid), Q.experimentalSortBy('ts', Q.desc), Q.experimentalSkip(0), Q.experimentalTake(count.current))
				.observe();
		} else {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(count.current)
			] as (Q.WhereDescription | Q.Or)[];
			if (!showMessageInMainThread) {
				whereClause.push(Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))));
			}
			observable = db
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		subscription.current = observable.subscribe(result => {
			console.count(`useMessages subscribe ${rid} ${tmid}`);
			let messages: TAnyMessageModel[] = result;
			if (tmid && thread.current) {
				messages.push(thread.current);
			}

			/**
			 * Since 3.16.0 server version, the backend don't response with messages if
			 * hide system message is enabled
			 */
			if (compareServerVersion(serverVersion, 'lowerThan', '3.16.0') || hideSystemMessages.length) {
				messages = messages.filter(m => !m.t || !hideSystemMessages?.includes(m.t));
			}

			readThread();
			animateNextTransition();
			setMessages(messages);
		});
	}, [rid, tmid, showMessageInMainThread, serverVersion, hideSystemMessages]);

	const readThread = useDebounce(async () => {
		if (tmid) {
			try {
				await Services.readThreads(tmid);
			} catch {
				// Do nothing
			}
		}
	}, 1000);

	useLayoutEffect(() => {
		fetchMessages();

		return () => {
			unsubscribe();
			console.countReset(`useMessages ${rid} ${tmid}`);
			console.countReset(`useMessages fetchMessages ${rid} ${tmid}`);
			console.countReset(`useMessages subscribe ${rid} ${tmid}`);
		};
	}, [rid, tmid, showMessageInMainThread, serverVersion, hideSystemMessages, fetchMessages]);

	const unsubscribe = () => {
		subscription.current?.unsubscribe();
	};

	return [messages, messagesIds, fetchMessages] as const;
};
