import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";

interface Props {
  images: string[];
  fallbackAbbr: string;
  fallbackColor: string;
  height?: number;
  width?: number;
  horizontalPadding?: number;
  showArrows?: boolean;
}

export function PartImageCarousel({
  images,
  fallbackAbbr,
  fallbackColor,
  height = 200,
  width: widthProp,
  horizontalPadding = 0,
  showArrows = true,
}: Props) {
  const { width: screenW } = useWindowDimensions();
  const width = widthProp ?? screenW - horizontalPadding;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<string>>(null);
  const slides = images.length > 0 ? images : [];

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= slides.length) return;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    },
    [slides.length]
  );

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  };

  if (slides.length === 0) {
    return (
      <View style={[styles.fallback, { width, height, backgroundColor: fallbackColor }]}>
        <Text style={styles.fallbackAbbr}>{fallbackAbbr}</Text>
      </View>
    );
  }

  const canPrev = index > 0;
  const canNext = index < slides.length - 1;
  const arrowsVisible = showArrows && slides.length > 1;

  return (
    <View style={{ width, height }}>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        bounces={slides.length > 1}
        decelerationRate="fast"
        snapToInterval={width}
        snapToAlignment="start"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        keyExtractor={(uri, i) => `${uri}-${i}`}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={onScrollEnd}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: false }), 80);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width, height }} resizeMode="cover" />
        )}
      />

      {arrowsVisible ? (
        <>
          <Pressable
            style={[styles.arrow, styles.arrowLeft, !canPrev && styles.arrowDisabled]}
            onPress={() => goTo(index - 1)}
            disabled={!canPrev}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.arrow, styles.arrowRight, !canNext && styles.arrowDisabled]}
            onPress={() => goTo(index + 1)}
            disabled={!canNext}
            hitSlop={8}
          >
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
        </>
      ) : null}

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
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
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -20,
    width: 36,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
  arrowDisabled: { opacity: 0.35 },
  dots: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: { backgroundColor: "#fff", width: 18 },
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
