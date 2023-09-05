import React, { ReactElement, useLayoutEffect } from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';
import { useSupportedVersionMessage } from './useSupportedVersionMessage';
import * as HeaderButton from '../HeaderButton';

export const SupportedVersionsWarningSnaps = [600];

export const SupportedVersionsWarning = ({ navigation, route }: { navigation?: any; route?: any }): ReactElement | null => {
	const { colors } = useTheme();
	const message = useSupportedVersionMessage();

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: 'TBD'
		});

		if (route?.params?.showCloseButton) {
			navigation?.setOptions({
				headerLeft: () => <HeaderButton.CloseModal />
			});
		}
	}, [navigation, route]);

	if (!message) {
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			{message.title ? (
				<Text testID='sv-warn-title' style={[styles.title, { color: colors.bodyText }]}>
					{message.title}
				</Text>
			) : null}
			{message.subtitle ? (
				<Text testID='sv-warn-subtitle' style={[styles.subtitle, { color: colors.bodyText }]}>
					{message.subtitle}
				</Text>
			) : null}
			{message.description ? (
				<Text testID='sv-warn-description' style={[styles.description, { color: colors.bodyText }]}>
					{message.description}
				</Text>
			) : null}
			<Button
				testID='sv-warn-button'
				title='Learn more'
				type='secondary'
				backgroundColor={colors.chatComponentBackground}
				onPress={() => alert(message.link)}
			/>
		</View>
	);
};
