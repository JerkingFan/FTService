import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { Part } from "../types";
import { colors } from "../theme";
import { formatPrice } from "../utils/format";

function partImages(part: Part): string[] {
  if (part.images?.length) return part.images;
  if (part.image_url) return [part.image_url];
  return [];
}

interface Props {
  visible: boolean;
  parts: Part[];
  initialPartId: number;
  initialImageIndex?: number;
  onClose: () => void;
  onPartIndexChange?: (part: Part, index: number) => void;
}

export function PartPhotoViewer({
  visible,
  parts,
  initialPartId,
  initialImageIndex = 0,
  onClose,
  onPartIndexChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get("window");
  const verticalRef = useRef<FlatList<Part>>(null);

  const feed = useMemo(() => parts.filter((p) => partImages(p).length > 0), [parts]);

  const startPartIndex = useMemo(() => {
    const i = feed.findIndex((p) => p.id === initialPartId);
    return i >= 0 ? i : 0;
  }, [feed, initialPartId]);

  const [partIndex, setPartIndex] = useState(startPartIndex);
  const [imageIndex, setImageIndex] = useState(initialImageIndex);

  useEffect(() => {
    if (!visible) return;
    setPartIndex(startPartIndex);
    setImageIndex(initialImageIndex);
    requestAnimationFrame(() => {
      verticalRef.current?.scrollToIndex({ index: startPartIndex, animated: false });
    });
  }, [visible, startPartIndex, initialImageIndex]);

  const current = feed[partIndex];
  const currentImages = current ? partImages(current) : [];

  const onVerticalEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.y / height);
    if (next === partIndex || next < 0 || next >= feed.length) return;
    setPartIndex(next);
    setImageIndex(0);
    onPartIndexChange?.(feed[next], next);
  };

  if (!visible || feed.length === 0) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <FlatList
          ref={verticalRef}
          data={feed}
          keyExtractor={(p) => `part_${p.id}`}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={height}
          snapToAlignment="start"
          disableIntervalMomentum
          initialScrollIndex={startPartIndex}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          onMomentumScrollEnd={onVerticalEnd}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              verticalRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
          renderItem={({ item, index }) => (
            <PartPage
              part={item}
              pageHeight={height}
              pageWidth={width}
              isActive={index === partIndex}
              initialImageIndex={index === startPartIndex && visible ? initialImageIndex : 0}
              onImageIndexChange={(imgIdx) => {
                if (index === partIndex) setImageIndex(imgIdx);
              }}
            />
          )}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Ionicons name="chevron-down" size={28} color="#fff" />
          </Pressable>
          <View style={styles.topCenter}>
            {currentImages.length > 1 ? (
              <Text style={styles.counter}>
                {imageIndex + 1} / {currentImages.length}
              </Text>
            ) : null}
            {feed.length > 1 ? (
              <Text style={styles.counterSub}>
                {partIndex + 1} / {feed.length}
              </Text>
            ) : null}
          </View>
          <View style={styles.closeBtn} />
        </View>

        {current ? (
          <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.hint}>← → фото · ↑ ↓ объявления</Text>
            <Text style={styles.title} numberOfLines={2}>
              {current.title}
            </Text>
            <Text style={styles.price}>{formatPrice(current.price)}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function PartPage({
  part,
  pageWidth,
  pageHeight,
  isActive,
  initialImageIndex,
  onImageIndexChange,
}: {
  part: Part;
  pageWidth: number;
  pageHeight: number;
  isActive: boolean;
  initialImageIndex: number;
  onImageIndexChange: (index: number) => void;
}) {
  const images = partImages(part);
  const listRef = useRef<FlatList<string>>(null);
  const [imgIdx, setImgIdx] = useState(initialImageIndex);

  useEffect(() => {
    if (!isActive) return;
    setImgIdx(initialImageIndex);
    if (initialImageIndex > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: initialImageIndex, animated: false });
      });
    }
  }, [isActive, initialImageIndex, part.id]);

  return (
    <View style={{ width: pageWidth, height: pageHeight }}>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        keyExtractor={(u, i) => `${part.id}_${i}_${u}`}
        initialScrollIndex={initialImageIndex > 0 ? initialImageIndex : undefined}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        onMomentumScrollEnd={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
          setImgIdx(next);
          if (isActive) onImageIndexChange(next);
        }}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 50);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width: pageWidth, height: pageHeight }]}>
            <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
          </View>
        )}
      />
      {images.length > 1 ? (
        <View style={styles.dots}>
          {images.map((_, i) => (
            <View key={String(i)} style={[styles.dot, i === imgIdx && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  slide: { alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
  image: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  topCenter: { flex: 1, alignItems: "center" },
  counter: { color: "#fff", fontSize: 15, fontWeight: "700" },
  counterSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 },
  bottomInfo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 48,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  hint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  price: { color: colors.orange, fontSize: 22, fontWeight: "800" },
  dots: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.35)" },
  dotActive: { backgroundColor: "#fff", width: 16 },
});
