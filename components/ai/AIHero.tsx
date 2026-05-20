import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { FontFamily } from '@/constants/fonts';
import { useUser } from '@/context/UserContext';

function extractFirstName(email: string | null): string {
  if (!email) return '';
  const local = email.split('@')[0];
  const part = local.split(/[._-]/)[0];
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export default function AIHero() {
  const { email } = useUser();
  const name = extractFirstName(email);
  const greeting = name ? `Bonjour ${name}` : 'Bonjour !';

  return (
    <View style={styles.area}>
      <View style={styles.block}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Svg width={311} height={105}>
          <Defs>
            <SvgLinearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#000000" />
              <Stop offset="100%" stopColor="#8F8F8F" />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill="url(#heroGrad)"
            fontSize="39"
            fontFamily="Gabarito"
            fontWeight="500"
            textAnchor="middle"
            x="155"
            y="44"
          >
            Comment puis-je
          </SvgText>
          <SvgText
            fill="url(#heroGrad)"
            fontSize="39"
            fontFamily="Gabarito"
            fontWeight="500"
            textAnchor="middle"
            x="155"
            y="96"
          >
            t'aider ?
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 36,
  },
  block: {
    alignItems: 'center',
    gap: 7,
  },
  greeting: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 19,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
});
