import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { FlatListProps, View, Platform, StyleSheet, ViewToken, ViewabilityConfigCallbackPairs } from 'react-native';

import List, { TListRef } from './List';
import { useMessages } from './useMessages';
import EmptyRoom from '../EmptyRoom';
import { useDebounce } from '../../../lib/methods/helpers';
import RefreshControl from './RefreshControl';
import { useRefresh } from './useRefresh';

interface IListContainerRef {
	jumpToMessage: (messageId: string) => Promise<void>;
	cancelJumpToMessage: () => void;
}

export interface IListContainerProps {
	renderRow: Function;
	rid: string;
	tmid?: string;
	loading: boolean;
	listRef: TListRef;
	hideSystemMessages: string[];
	tunread?: string[];
	ignored?: string[];
	navigation: any; // TODO: type me
	showMessageInMainThread: boolean;
	serverVersion: string | null;
	autoTranslateRoom?: boolean;
	autoTranslateLanguage?: string;
}

const QUERY_SIZE = 50;
const VIEWABILITY_CONFIG = {
	itemVisiblePercentThreshold: 10
};

const RoomViewList = forwardRef<IListContainerRef, IListContainerProps>(
	({ rid, tmid, renderRow, showMessageInMainThread, serverVersion, hideSystemMessages, listRef }, ref) => {
		console.count('RoomViewList');
		const [count, setCount] = useState(QUERY_SIZE);
		const messages = useMessages({ rid, tmid, showMessageInMainThread, serverVersion, count, hideSystemMessages });
		const [refreshing, refresh] = useRefresh({ rid, tmid, messagesLength: messages.length });
		const cancelJump = useRef(false);
		const jumping = useRef(false);
		const viewableItems = useRef<ViewToken[] | null>(null);

		const onEndReached = useDebounce(() => {
			console.count('RoomViewList.onEndReached');
			setCount(prevCount => prevCount + QUERY_SIZE);
		});

		const jumpToBottom = () => {
			listRef.current?.scrollToOffset({ offset: -100 });
		};

		const onViewableItemsChanged: FlatListProps<any>['onViewableItemsChanged'] = ({ viewableItems: vi }) => {
			viewableItems.current = vi;
		};

		const viewabilityConfigCallbackPairs = useRef<ViewabilityConfigCallbackPairs>([
			{ onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG }
		]);

		const handleScrollToIndexFailed: FlatListProps<any>['onScrollToIndexFailed'] = params => {
			listRef.current?.scrollToIndex({ index: params.highestMeasuredFrameIndex, animated: false });
		};

		const jumpToMessage: IListContainerRef['jumpToMessage'] = messageId =>
			new Promise<void>(async resolve => {
				// if jump to message was cancelled, reset variables and stop
				if (cancelJump.current) {
					resetJumpToMessage();
					return resolve();
				}
				jumping.current = true;

				// look for the message on the state
				const index = messages.findIndex(item => item.id === messageId);
				console.log(messages.length);

				// if found message, scroll to it
				if (index > -1) {
					listRef.current?.scrollToIndex({ index, viewPosition: 0.5, viewOffset: 100 });

					// wait for scroll animation to finish
					await new Promise(res => setTimeout(res, 300));

					// if message is not visible
					if (!viewableItems.current?.map(vi => vi.key).includes(messageId)) {
						await setTimeout(() => resolve(jumpToMessage(messageId)), 300);
						return;
					}
					// if message is visible, highlight it
					// this.setState({ highlightedMessage: messageId });
					// this.clearHighlightedMessageTimeout();
					// // clears highlighted message after some time
					// this.highlightedMessageTimeout = setTimeout(() => {
					// 	this.setState({ highlightedMessage: null });
					// }, 5000);
					resetJumpToMessage();
					resolve();
				} else {
					// if message not on state yet, scroll to top, so it triggers onEndReached and try again
					listRef.current?.scrollToEnd();
					await setTimeout(() => resolve(jumpToMessage(messageId)), 600);
				}
			});

		const resetJumpToMessage = () => {
			cancelJump.current = false;
			jumping.current = false;
		};

		const cancelJumpToMessage: IListContainerRef['cancelJumpToMessage'] = () => {
			if (jumping.current) {
				cancelJump.current = true;
				return;
			}
			resetJumpToMessage();
		};

		useImperativeHandle(ref, () => ({
			jumpToMessage,
			cancelJumpToMessage
		}));

		const renderItem: FlatListProps<any>['renderItem'] = ({ item, index }) => (
			// const { messages, highlightedMessage } = this.state;
			// const { renderRow } = this.props;
			// <View style={styles.inverted}>{renderRow(item, messages[index + 1], highlightedMessage)}</View>
			// TODO: reevaluate second argument
			<View style={styles.inverted}>{renderRow(item, messages[index + 1], null)}</View>
		);

		return (
			<>
				<EmptyRoom rid={rid} length={messages.length} />
				<RefreshControl refreshing={refreshing} onRefresh={refresh}>
					<List
						listRef={listRef}
						data={messages}
						renderItem={renderItem}
						onEndReached={onEndReached}
						// ListFooterComponent={this.renderFooter}
						onScrollToIndexFailed={handleScrollToIndexFailed}
						viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
						jumpToBottom={jumpToBottom}
						isThread={!!tmid}
					/>
				</RefreshControl>
			</>
		);
	}
);

const styles = StyleSheet.create({
	inverted: {
		...Platform.select({
			android: {
				scaleY: -1
			}
		})
	}
});

export default RoomViewList;
