import React, { useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { colors, radius } from "../theme";

interface Props {
  images: string[];
  fallbackAbbr: string;
  fallbackColor: string;
  height?: number;
  /** Ширина слайда; по умолчанию — ширина экрана минус отступы списка */
  width?: number;
  horizontalPadding?: number;
}

export function PartImageCarousel({
  images,
  fallbackAbbr,
  fallbackColor,
  height = 200,
  width: widthProp,
  horizontalPadding = 0,
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const width = widthProp ?? screenW - horizontalPadding;
  const [index, setIndex] = useState(0);
  const slides = images.length > 0 ? images : [];

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  if (slides.length === 0) {
    return (
      <View style={[styles.fallback, { width, height, backgroundColor: fallbackColor }]}>
        <Text style={styles.fallbackAbbr}>{fallbackAbbr}</Text>
      </View>
    );
  }

  return (
    <View style={{ width, height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        bounces={slides.length > 1}
      >
        {slides.map((uri, i) => (
          <Image key={`${uri}-${i}`} source={{ uri }} style={{ width, height }} resizeMode="cover" />
        ))}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
      {slides.length > 1 ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1}/{slides.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackAbbr: { color: "rgba(255,255,255,0.92)", fontSize: 28, fontWeight: "800" },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: { backgroundColor: "#fff", width: 16 },
  counter: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterText: { color: colors.surface, fontSize: 11, fontWeight: "700" },
});
