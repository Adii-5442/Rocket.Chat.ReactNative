import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
import Button from '../Button';
import { styles } from './styles';
import { useAppSelector } from '../../lib/hooks';
import { showActionSheetRef } from '../ActionSheet';

// Action sheet snaps
export const SupportedVersionsWarningSnaps = [600];

export const SupportedVersionsWarning = () => {
	const { colors } = useTheme();
	const { message, i18n } = useAppSelector(state => state.supportedVersions);
	const lang = 'en';

	if (!message) {
		return null;
	}

	// TODO: i18n
	return (
		<View style={styles.container}>
			<View style={styles.iconContainer}>
				<CustomIcon name='warning' size={36} color={colors.dangerColor} />
			</View>
			{message.title ? <Text style={[styles.title, { color: colors.bodyText }]}>{i18n![lang][message.title]}</Text> : null}
			{message.subtitle ? (
				<Text style={[styles.subtitle, { color: colors.bodyText }]}>{i18n![lang][message.subtitle]}</Text>
			) : null}
			{message.description ? (
				<Text style={[styles.description, { color: colors.bodyText }]}>{i18n![lang][message.description]}</Text>
			) : null}
			<Button title='Learn more' type='secondary' backgroundColor={'#EEEFF1'} onPress={() => alert(message.link)} />
		</View>
	);
};

export const showSVWarningActionSheet = () =>
	showActionSheetRef({ children: <SupportedVersionsWarning />, snaps: SupportedVersionsWarningSnaps });
