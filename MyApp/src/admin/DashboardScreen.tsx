// // // // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // // // import {
// // // // //   View,
// // // // //   Text,
// // // // //   Image,
// // // // //   ScrollView,
// // // // //   TouchableOpacity,
// // // // //   StyleSheet,
// // // // //   Dimensions,
// // // // //   ActivityIndicator,
// // // // //   StatusBar,
// // // // //   RefreshControl,
// // // // //   FlatList,
// // // // // } from "react-native";
// // // // // import { useIsFocused, useNavigation } from "@react-navigation/native";
// // // // // import { VideoView, useVideoPlayer } from "expo-video";
// // // // // import {
// // // // //   BadgeCheck,
// // // // //   ChevronRight,
// // // // //   Play,
// // // // //   Plus,
// // // // //   Check,
// // // // // } from "lucide-react-native";
// // // // // import Toast from "react-native-toast-message";
// // // // // import AsyncStorage from "@react-native-async-storage/async-storage";
// // // // // import Navbar from "./Navbar";
// // // // // import TopicChips from "./TopicChips";
// // // // // import { getViewSocket } from "../utils/viewSocket";

// // // // // import { API_ORIGIN } from "../../config/api";

// // // // // const { width: SCREEN_WIDTH } = Dimensions.get("window");

// // // // // const CARD_WIDTH = SCREEN_WIDTH * 0.42;
// // // // // const CARD_HEIGHT = CARD_WIDTH * (9 / 16);
// // // // // const TWO_CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;
// // // // // const TWO_CARD_HEIGHT = TWO_CARD_WIDTH * (9 / 16);
// // // // // const CARD_GAP = 14;
// // // // // const TWO_CARD_SNAP_INTERVAL = TWO_CARD_WIDTH * 2 + CARD_GAP;

// // // // // const SHORT_WIDTH = (SCREEN_WIDTH - 44) / 2;
// // // // // const SHORT_HEIGHT = SHORT_WIDTH * (16 / 9);

// // // // // const BACKEND_URL = API_ORIGIN;
// // // // // const API_BASE = `${BACKEND_URL}/api/uservideo`;
// // // // // const FEED_PAGE_SIZE = 5;
// // // // // const TRENDING_HOME_LIMIT = 5;
// // // // // const MAX_PAGES_PER_FEED_LOAD = 20;

// // // // // const hasMoreVideoPages = (payload, page, limit, itemCount) => {
// // // // //   if (typeof payload?.hasMore === "boolean") return payload.hasMore;

// // // // //   const total = Number(payload?.total ?? payload?.pagination?.total);
// // // // //   if (Number.isFinite(total)) return total > page * limit;

// // // // //   return itemCount >= limit;
// // // // // };

// // // // // function AutoplayPreview({ uri, style }) {
// // // // //   const player = useVideoPlayer(uri, (instance) => {
// // // // //     instance.loop = true;
// // // // //     instance.muted = true;
// // // // //     instance.play();
// // // // //   });

// // // // //   return (
// // // // //     <VideoView
// // // // //       player={player}
// // // // //       style={style}
// // // // //       contentFit="cover"
// // // // //       nativeControls={false}
// // // // //       allowsPictureInPicture={false}
// // // // //     />
// // // // //   );
// // // // // }

// // // // // const toMediaUrl = (value: unknown, fallback: string) => {
// // // // //   if (!value) return fallback;

// // // // //   const path = String(value).replace(/\\/g, "/");
// // // // //   if (/^https?:\/\//i.test(path)) return path;

// // // // //   return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
// // // // // };

// // // // // // ────────────────────────────────────────────────
// // // // // // Helpers
// // // // // // ────────────────────────────────────────────────
// // // // // const normalizeVideoListItem = (video: Record<string, any> = {}) => ({
// // // // //   id: video._id || video.id,
// // // // //   title: video.title || "Untitled video",
// // // // //   thumb: toMediaUrl(
// // // // //     video.thumbnail,
// // // // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // // //   ),
// // // // //   thumbnail: toMediaUrl(
// // // // //     video.thumbnail,
// // // // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // // //   ),
// // // // //   description: video.description || "",
// // // // //   views: Number(video.views ?? video.viewCount ?? 0),
// // // // //   likesCount: Number(video.likesCount ?? video.likes ?? 0),
// // // // //   dislikesCount: Number(video.dislikesCount ?? 0),
// // // // //   videoUrl: toMediaUrl(video.videoUrl, ""),
// // // // //   videoType: video.videoType || null,
// // // // //   raw: video,
// // // // //   channel: video.channel || null,
// // // // //   createdAt: video.createdAt || null,
// // // // //   duration: video.duration ?? video.durationSeconds ?? video.videoDuration,
// // // // //   uploadDate: video.uploadDate || video.createdAt || null,
// // // // //   watchedPercent: Number(video.watchedPercent || 0),
// // // // //   isLiked: Boolean(video.isLiked || video.userReaction === "like"),
// // // // //   isDisliked: Boolean(video.isDisliked || video.userReaction === "dislike"),
// // // // // });

// // // // // const normalizeShort = (video: Record<string, any> = {}) => ({
// // // // //   id: video._id || video.id,
// // // // //   title: video.title || "Untitled short",
// // // // //   thumbnail: toMediaUrl(
// // // // //     video.thumbnail,
// // // // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // // //   ),
// // // // //   views: Number(video.views ?? video.viewCount ?? 0),
// // // // //   likes: Number(video.likesCount ?? video.likes ?? 0),
// // // // //   comments: Number(video.comments || 0),
// // // // //   videoUrl: toMediaUrl(video.videoUrl, ""),
// // // // //   videoType: video.videoType || "short",
// // // // //   raw: video,
// // // // //   isShort: true,
// // // // // });

// // // // // const normalizeSubscriptionChannel = (channel: Record<string, any> = {}) => ({
// // // // //   id: channel._id || channel.id || channel.channelId,
// // // // //   title: channel.name || channel.channelName || "Subscribed Channel",
// // // // //   thumb:
// // // // //     channel.channelImage ||
// // // // //     channel.avatar ||
// // // // //     channel.image ||
// // // // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // // //   thumbnail:
// // // // //     channel.channelImage ||
// // // // //     channel.avatar ||
// // // // //     channel.image ||
// // // // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // // //   description: channel.description || "",
// // // // //   views: Number(channel.views || 0),
// // // // //   raw: channel,
// // // // //   channel: channel.channel || channel,
// // // // //   isChannel: true,
// // // // //   videoType: "channel",
// // // // // });

// // // // // const getArrayFromPayload = (payload: any): Record<string, any>[] => {
// // // // //   if (Array.isArray(payload)) return payload;
// // // // //   if (Array.isArray(payload?.videos)) return payload.videos;
// // // // //   if (Array.isArray(payload?.data)) return payload.data;
// // // // //   if (Array.isArray(payload?.channels)) return payload.channels;
// // // // //   if (Array.isArray(payload?.subscribedChannels))
// // // // //     return payload.subscribedChannels;
// // // // //   if (Array.isArray(payload?.subscribers)) return payload.subscribers;
// // // // //   return [];
// // // // // };

// // // // // const fetchWithAuth = async (endpoint, params = {}) => {
// // // // //   try {
// // // // //     const token = await AsyncStorage.getItem("token");
// // // // //     const headers = token ? { Authorization: `Bearer ${token}` } : {};
// // // // //     const query = new URLSearchParams(
// // // // //       Object.entries(params)
// // // // //         .filter(([, value]) => value !== undefined)
// // // // //         .map(([key, value]) => [key, String(value)]),
// // // // //     ).toString();

// // // // //     const res = await fetch(
// // // // //       `${API_BASE}/${endpoint}${query ? `?${query}` : ""}`,
// // // // //       {
// // // // //         headers,
// // // // //       },
// // // // //     );
// // // // //     if (!res.ok) {
// // // // //       throw new Error(`${endpoint} request failed (${res.status})`);
// // // // //     }

// // // // //     const data = await res.json();
// // // // //     if (data?.success === false) {
// // // // //       throw new Error(data.message || `${endpoint} request failed`);
// // // // //     }
// // // // //     return data;
// // // // //   } catch (e) {
// // // // //     console.warn(`Fetch error (${endpoint}):`, e);
// // // // //     throw e;
// // // // //   }
// // // // // };

// // // // // // ────────────────────────────────────────────────
// // // // // // Components
// // // // // // ────────────────────────────────────────────────
// // // // // type VideoCardItem = {
// // // // //   id?: string | number;
// // // // //   title: string;
// // // // //   thumb?: string;
// // // // //   thumbnail?: string;
// // // // //   views?: number;
// // // // //   watchedPercent?: number;
// // // // //   duration?: string | number;
// // // // //   uploadDate?: string | number | Date | null;
// // // // //   createdAt?: string | number | Date | null;
// // // // //   channel?: unknown;
// // // // //   uploadedBy?: unknown;
// // // // //   creator?: unknown;
// // // // //   channelName?: string;
// // // // // };

// // // // // type WatchLaterResult = { success: boolean };

// // // // // type MovieCardProps = {
// // // // //   item: VideoCardItem;
// // // // //   onPress: (item: VideoCardItem) => void;
// // // // //   onAddToWatchLater?: (
// // // // //     item: VideoCardItem,
// // // // //   ) => Promise<WatchLaterResult | undefined>;
// // // // //   onRemoveFromWatchLater?: (
// // // // //     item: VideoCardItem,
// // // // //   ) => Promise<WatchLaterResult | undefined>;
// // // // //   twoColumn?: boolean;
// // // // // };

// // // // // const asRecord = (value: unknown): Record<string, unknown> | null =>
// // // // //   typeof value === "object" && value !== null && !Array.isArray(value)
// // // // //     ? (value as Record<string, unknown>)
// // // // //     : null;

// // // // // const formatDuration = (value: VideoCardItem["duration"]): string => {
// // // // //   if (typeof value === "string" && value.includes(":")) return value;
// // // // //   const seconds = Number(value);
// // // // //   if (!Number.isFinite(seconds) || seconds <= 0) return "";

// // // // //   const totalSeconds = Math.floor(seconds);
// // // // //   const hours = Math.floor(totalSeconds / 3600);
// // // // //   const minutes = Math.floor((totalSeconds % 3600) / 60);
// // // // //   const remainingSeconds = totalSeconds % 60;
// // // // //   return hours > 0
// // // // //     ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
// // // // //     : `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
// // // // // };

// // // // // const formatViews = (value: number | undefined): string => {
// // // // //   const views = Number(value) || 0;
// // // // //   if (views >= 1_000_000) {
// // // // //     return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
// // // // //   }
// // // // //   if (views >= 1_000) {
// // // // //     return `${(views / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
// // // // //   }
// // // // //   return `${views.toLocaleString()} views`;
// // // // // };

// // // // // const formatUploadTime = (
// // // // //   value: VideoCardItem["uploadDate"] | VideoCardItem["createdAt"],
// // // // // ): string => {
// // // // //   if (!value) return "";
// // // // //   const date = value instanceof Date ? value : new Date(value);
// // // // //   if (Number.isNaN(date.getTime())) return "";

// // // // //   const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
// // // // //   if (minutes < 1) return "Just now";
// // // // //   if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
// // // // //   const hours = Math.floor(minutes / 60);
// // // // //   if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
// // // // //   const days = Math.floor(hours / 24);
// // // // //   if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
// // // // //   const weeks = Math.floor(days / 7);
// // // // //   if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
// // // // //   const months = Math.floor(days / 30);
// // // // //   if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
// // // // //   const years = Math.floor(days / 365);
// // // // //   return `${years} year${years === 1 ? "" : "s"} ago`;
// // // // // };

// // // // // function SectionHeader({ title, onPress }) {
// // // // //   return (
// // // // //     <TouchableOpacity
// // // // //       activeOpacity={0.8}
// // // // //       onPress={onPress}
// // // // //       style={styles.sectionHeader}
// // // // //     >
// // // // //       <Text style={styles.sectionTitle}>{title}</Text>
// // // // //       <ChevronRight size={20} color="#a1a1aa" />
// // // // //     </TouchableOpacity>
// // // // //   );
// // // // // }

// // // // // function MovieCard({
// // // // //   item,
// // // // //   onPress,
// // // // //   onAddToWatchLater,
// // // // //   onRemoveFromWatchLater,
// // // // //   twoColumn = false,
// // // // // }: MovieCardProps) {
// // // // //   const [adding, setAdding] = useState(false);
// // // // //   const [saved, setSaved] = useState(false);
// // // // //   const [avatarFailed, setAvatarFailed] = useState(false);
// // // // //   const cardWidth = twoColumn ? TWO_CARD_WIDTH : CARD_WIDTH;
// // // // //   const cardHeight = twoColumn ? TWO_CARD_HEIGHT : CARD_HEIGHT;

// // // // //   const handleWatchLater = async () => {
// // // // //     if (adding || (!onAddToWatchLater && !onRemoveFromWatchLater)) return;
// // // // //     setAdding(true);
// // // // //     const previousSaved = saved;
// // // // //     setSaved(!previousSaved);
// // // // //     try {
// // // // //       const result = previousSaved
// // // // //         ? await onRemoveFromWatchLater?.(item)
// // // // //         : await onAddToWatchLater?.(item);
// // // // //       if (!result?.success) setSaved(previousSaved);
// // // // //     } catch (error) {
// // // // //       setSaved(previousSaved);
// // // // //       console.warn("Watch Later update failed:", error);
// // // // //     } finally {
// // // // //       setAdding(false);
// // // // //     }
// // // // //   };

// // // // //   const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));
// // // // //   const channel = asRecord(item.channel);
// // // // //   const uploadedBy = asRecord(item.uploadedBy);
// // // // //   const creator = asRecord(item.creator);
// // // // //   const channelName = String(
// // // // //     channel?.name ||
// // // // //       uploadedBy?.name ||
// // // // //       creator?.name ||
// // // // //       item.channelName ||
// // // // //       "Unknown Channel",
// // // // //   );
// // // // //   const avatarValue =
// // // // //     channel?.avatar ||
// // // // //     channel?.profileImage ||
// // // // //     channel?.channelImage ||
// // // // //     uploadedBy?.avatar ||
// // // // //     uploadedBy?.profileImage;
// // // // //   const channelAvatar =
// // // // //     typeof avatarValue === "string" && avatarValue
// // // // //       ? toMediaUrl(avatarValue, "")
// // // // //       : "";
// // // // //   const isVerified = Boolean(
// // // // //     channel?.isVerified || channel?.verified || uploadedBy?.isVerified,
// // // // //   );
// // // // //   const durationText = formatDuration(item.duration);
// // // // //   const uploadText = formatUploadTime(item.uploadDate || item.createdAt);

// // // // //   return (
// // // // //     <TouchableOpacity
// // // // //       activeOpacity={0.9}
// // // // //       onPress={() => onPress(item)}
// // // // //       style={[
// // // // //         styles.cardWrapper,
// // // // //         twoColumn && styles.twoColumnCardWrapper,
// // // // //         { width: cardWidth },
// // // // //       ]}
// // // // //     >
// // // // //       {/* Thumbnail */}
// // // // //       <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
// // // // //         <Image
// // // // //           source={{ uri: item.thumb || item.thumbnail }}
// // // // //           style={styles.cardImage}
// // // // //           resizeMode="cover"
// // // // //         />

// // // // //         {durationText ? (
// // // // //           <View style={styles.durationBadge}>
// // // // //             <Text style={styles.durationText}>{durationText}</Text>
// // // // //           </View>
// // // // //         ) : null}

// // // // //         {/* Subtle gradient + actions */}
// // // // //         <View style={styles.cardOverlay}>
// // // // //           <View style={styles.cardActions}>
// // // // //             <TouchableOpacity
// // // // //               style={styles.actionBtnWhite}
// // // // //               onPress={() => onPress(item)}
// // // // //             >
// // // // //               <Play size={14} color="#000" fill="#000" />
// // // // //             </TouchableOpacity>

// // // // //             {(onAddToWatchLater || onRemoveFromWatchLater) && (
// // // // //               <TouchableOpacity
// // // // //                 style={[styles.actionBtnBorder, adding && { opacity: 0.5 }]}
// // // // //                 onPress={handleWatchLater}
// // // // //                 disabled={adding}
// // // // //                 accessibilityRole="button"
// // // // //                 accessibilityLabel={
// // // // //                   saved ? "Remove from Watch Later" : "Add to Watch Later"
// // // // //                 }
// // // // //               >
// // // // //                 {saved ? (
// // // // //                   <Check size={14} color="#fff" />
// // // // //                 ) : (
// // // // //                   <Plus size={14} color="#fff" />
// // // // //                 )}
// // // // //               </TouchableOpacity>
// // // // //             )}
// // // // //           </View>
// // // // //         </View>

// // // // //         {/* Progress bar */}
// // // // //         {progress > 0 && (
// // // // //           <View style={styles.progressBarContainer}>
// // // // //             <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
// // // // //           </View>
// // // // //         )}
// // // // //       </View>

// // // // //       <View style={styles.cardInfo}>
// // // // //         <View style={styles.channelAvatar}>
// // // // //           {channelAvatar && !avatarFailed ? (
// // // // //             <Image
// // // // //               source={{ uri: channelAvatar }}
// // // // //               style={styles.channelAvatarImage}
// // // // //               resizeMode="cover"
// // // // //               onError={() => setAvatarFailed(true)}
// // // // //             />
// // // // //           ) : (
// // // // //             <Text style={styles.channelAvatarInitial}>
// // // // //               {channelName.charAt(0).toUpperCase()}
// // // // //             </Text>
// // // // //           )}
// // // // //         </View>
// // // // //         <View style={styles.cardTextInfo}>
// // // // //           <Text style={styles.cardTitle} numberOfLines={2}>
// // // // //             {item.title}
// // // // //           </Text>
// // // // //           <View style={styles.channelNameRow}>
// // // // //             <Text style={styles.channelName} numberOfLines={1}>
// // // // //               {channelName}
// // // // //             </Text>
// // // // //             {isVerified ? <BadgeCheck size={13} color="#a1a1aa" /> : null}
// // // // //           </View>
// // // // //           <Text style={styles.viewsText} numberOfLines={1}>
// // // // //             {formatViews(item.views)}
// // // // //             {uploadText ? ` • ${uploadText}` : ""}
// // // // //           </Text>
// // // // //         </View>
// // // // //       </View>
// // // // //     </TouchableOpacity>
// // // // //   );
// // // // // }

// // // // // // ────────────────────────────────────────────────
// // // // // // Main Screen
// // // // // // ────────────────────────────────────────────────
// // // // // export default function NetflixStylePage() {
// // // // //   const navigation = useNavigation<any>();
// // // // //   const isFocused = useIsFocused();

// // // // //   const [recommended, setRecommended] = useState([]);
// // // // //   const [trending, setTrending] = useState([]);
// // // // //   const [latest, setLatest] = useState([]);
// // // // //   const [subscriptions, setSubscriptions] = useState([]);
// // // // //   const [shorts, setShorts] = useState([]);
// // // // //   const [selectedTopic, setSelectedTopic] = useState("For you");
// // // // //   const [selectedCategoryId, setSelectedCategoryId] = useState(null);
// // // // //   const [loading, setLoading] = useState(true);
// // // // //   const [refreshing, setRefreshing] = useState(false);
// // // // //   const [loadingMore, setLoadingMore] = useState(false);
// // // // //   const [hasMore, setHasMore] = useState(true);
// // // // //   const [feedLoadError, setFeedLoadError] = useState("");

// // // // //   // Mixed feed for YouTube-like continuous scroll
// // // // //   const [mixedFeed, setMixedFeed] = useState([]);
// // // // //   const [afterShortsRecommendations, setAfterShortsRecommendations] =
// // // // //     useState([]);
// // // // //   const [loadingAfterShortsRecommendations, setLoadingAfterShortsRecommendations] =
// // // // //     useState(false);
// // // // //   const [hasMoreAfterShortsRecommendations, setHasMoreAfterShortsRecommendations] =
// // // // //     useState(true);
// // // // //   const [afterShortsRecommendationsError, setAfterShortsRecommendationsError] =
// // // // //     useState("");
// // // // //   const [loadingAfterShortsTrending, setLoadingAfterShortsTrending] =
// // // // //     useState(false);
// // // // //   const [hasMoreAfterShortsTrending, setHasMoreAfterShortsTrending] =
// // // // //     useState(true);
// // // // //   const [afterShortsTrendingError, setAfterShortsTrendingError] = useState("");
// // // // //   const nextPageRef = useRef(1);
// // // // //   const latestVideoIdsRef = useRef(new Set<string>());
// // // // //   const homeLoadRequestIdRef = useRef(0);
// // // // //   const loadingMoreRef = useRef(false);
// // // // //   const afterShortsPageRef = useRef(2);
// // // // //   const loadingAfterShortsRef = useRef(false);
// // // // //   const afterShortsRequestIdRef = useRef(0);
// // // // //   const loadAfterShortsRecommendationsRef = useRef<
// // // // //     ((retry?: boolean, force?: boolean) => Promise<void>) | null
// // // // //   >(null);
// // // // //   const afterShortsTrendingPageRef = useRef(2);
// // // // //   const loadingAfterShortsTrendingRef = useRef(false);
// // // // //   const afterShortsTrendingRequestIdRef = useRef(0);
// // // // //   const loadAfterShortsTrendingRef = useRef<
// // // // //     ((retry?: boolean, force?: boolean) => Promise<void>) | null
// // // // //   >(null);
// // // // //   const seenFeedVideoIdsRef = useRef(new Set<string>());
// // // // //   const seenTrendingVideoIdsRef = useRef(new Set<string>());

// // // // //   // Autoplay state (YouTube style)
// // // // //   const [activeVideoId, setActiveVideoId] = useState(null);

// // // // //   const isShortContent = (item) => {
// // // // //     const rawTypes = item?.videoType ?? item?.raw?.videoType ?? [];
// // // // //     const normalizedTypes = (Array.isArray(rawTypes) ? rawTypes : [rawTypes])
// // // // //       .filter(Boolean)
// // // // //       .map((type) => String(type).toLowerCase());

// // // // //     return (
// // // // //       Boolean(item?.isShort) ||
// // // // //       normalizedTypes.some(
// // // // //         (type) =>
// // // // //           type === "short" || type === "shorts" || type.includes("short"),
// // // // //       )
// // // // //     );
// // // // //   };

// // // // //   // Viewability config for autoplay when user stops scrolling
// // // // //   const viewabilityConfig = useRef({
// // // // //     itemVisiblePercentThreshold: 60,
// // // // //     minimumViewTime: 250,
// // // // //   }).current;

// // // // //   const onViewableItemsChanged = useRef(({ viewableItems }) => {
// // // // //     if (viewableItems && viewableItems.length > 0) {
// // // // //       // Pick the most visible item
// // // // //       const mostVisible = viewableItems.reduce((mostVisibleItem, item) =>
// // // // //         (item?.percentVisible ?? 0) >
// // // // //         (mostVisibleItem?.percentVisible ?? 0)
// // // // //           ? item
// // // // //           : mostVisibleItem,
// // // // //       );
// // // // //       const item = mostVisible?.item;

// // // // //       if (item?.id && !isShortContent(item) && item.videoUrl) {
// // // // //         setActiveVideoId(item.id);
// // // // //       } else {
// // // // //         setActiveVideoId(null);
// // // // //       }
// // // // //     } else {
// // // // //       setActiveVideoId(null);
// // // // //     }
// // // // //   }).current;

// // // // //   const loadHomeData = useCallback(
// // // // //     async (page = 1, append = false) => {
// // // // //       const requestId = append
// // // // //         ? homeLoadRequestIdRef.current
// // // // //         : ++homeLoadRequestIdRef.current;
// // // // //       if (!append) {
// // // // //         afterShortsRequestIdRef.current += 1;
// // // // //         loadingAfterShortsRef.current = false;
// // // // //         afterShortsPageRef.current = 2;
// // // // //         setLoadingAfterShortsRecommendations(false);
// // // // //         afterShortsTrendingRequestIdRef.current += 1;
// // // // //         loadingAfterShortsTrendingRef.current = false;
// // // // //         afterShortsTrendingPageRef.current = 2;
// // // // //         setLoadingAfterShortsTrending(false);
// // // // //       }
// // // // //       try {
// // // // //         setFeedLoadError("");
// // // // //         const [
// // // // //           recommendedData,
// // // // //           trendingData,
// // // // //           latestData,
// // // // //           subscriptionsData,
// // // // //           shortsData,
// // // // //         ] = await Promise.all([
// // // // //           append
// // // // //             ? Promise.resolve({ videos: [] })
// // // // //             : fetchWithAuth("recommended", {
// // // // //                 page: 1,
// // // // //                 limit: FEED_PAGE_SIZE,
// // // // //                 category: selectedCategoryId || undefined,
// // // // //               }),
// // // // //           append
// // // // //             ? Promise.resolve({ videos: [] })
// // // // //             : fetchWithAuth("trending", {
// // // // //                 page: 1,
// // // // //                 limit: TRENDING_HOME_LIMIT,
// // // // //                 category: selectedCategoryId || undefined,
// // // // //               }),
// // // // //           fetchWithAuth("latest", {
// // // // //             page,
// // // // //             limit: FEED_PAGE_SIZE,
// // // // //             category: selectedCategoryId || undefined,
// // // // //           }),
// // // // //           append
// // // // //             ? Promise.resolve({ videos: [] })
// // // // //             : fetchWithAuth("subscribed-channels"),
// // // // //           append
// // // // //             ? Promise.resolve({ videos: [] })
// // // // //             : fetchWithAuth("trending-shorts"),
// // // // //         ]);
// // // // //         if (requestId !== homeLoadRequestIdRef.current) return;

// // // // //         const rec = getArrayFromPayload(recommendedData).map(
// // // // //           normalizeVideoListItem,
// // // // //         );
// // // // //         const tren = getArrayFromPayload(trendingData).map(
// // // // //           normalizeVideoListItem,
// // // // //         );
// // // // //         const lat = getArrayFromPayload(latestData).map(normalizeVideoListItem);
// // // // //         const subs = getArrayFromPayload(subscriptionsData).map(
// // // // //           normalizeSubscriptionChannel,
// // // // //         );
// // // // //         const sh = getArrayFromPayload(shortsData).map(normalizeShort);

// // // // //         if (!append) {
// // // // //           seenFeedVideoIdsRef.current.clear();
// // // // //           seenTrendingVideoIdsRef.current.clear();
// // // // //           latestVideoIdsRef.current.clear();
// // // // //         }

// // // // //         const latestExcludedIds = new Set(seenFeedVideoIdsRef.current);
// // // // //         for (const item of [...rec, ...tren, ...sh]) {
// // // // //           if (item?.id != null) latestExcludedIds.add(String(item.id));
// // // // //         }

// // // // //         const latestBatch: Record<string, any>[] = [];
// // // // //         const latestBatchIds = new Set(latestVideoIdsRef.current);
// // // // //         let latestPage = page;
// // // // //         let latestHasMore = hasMoreVideoPages(
// // // // //           latestData,
// // // // //           page,
// // // // //           FEED_PAGE_SIZE,
// // // // //           getArrayFromPayload(latestData).length,
// // // // //         );
// // // // //         let latestPayload = latestData;
// // // // //         let latestPageItems = lat;
// // // // //         let latestAttempts = 0;

// // // // //         while (
// // // // //           latestAttempts < MAX_PAGES_PER_FEED_LOAD &&
// // // // //           latestHasMore &&
// // // // //           latestBatch.length < FEED_PAGE_SIZE
// // // // //         ) {
// // // // //           for (const item of latestPageItems) {
// // // // //             const id = item?.id == null ? "" : String(item.id);
// // // // //             if (
// // // // //               !id ||
// // // // //               latestExcludedIds.has(id) ||
// // // // //               latestBatchIds.has(id)
// // // // //             ) {
// // // // //               continue;
// // // // //             }
// // // // //             latestBatchIds.add(id);
// // // // //             latestBatch.push(item);
// // // // //             if (latestBatch.length >= FEED_PAGE_SIZE) break;
// // // // //           }

// // // // //           if (latestBatch.length >= FEED_PAGE_SIZE || !latestHasMore) break;
// // // // //           latestPage += 1;
// // // // //           latestPayload = await fetchWithAuth("latest", {
// // // // //             page: latestPage,
// // // // //             limit: FEED_PAGE_SIZE,
// // // // //             category: selectedCategoryId || undefined,
// // // // //           });
// // // // //           if (requestId !== homeLoadRequestIdRef.current) return;
// // // // //           latestPageItems = getArrayFromPayload(latestPayload).map(
// // // // //             normalizeVideoListItem,
// // // // //           );
// // // // //           latestHasMore = hasMoreVideoPages(
// // // // //             latestPayload,
// // // // //             latestPage,
// // // // //             FEED_PAGE_SIZE,
// // // // //             latestPageItems.length,
// // // // //           );
// // // // //           latestAttempts += 1;
// // // // //         }

// // // // //         latestVideoIdsRef.current = latestBatchIds;

// // // // //         if (!append) {
// // // // //           setRecommended(rec);
// // // // //           setTrending(tren);
// // // // //           setLatest(latestBatch);
// // // // //           setSubscriptions(subs);
// // // // //           setShorts(sh);
// // // // //         } else {
// // // // //           setLatest((current) => [...current, ...latestBatch]);
// // // // //         }

// // // // //         if (!append) {
// // // // //           afterShortsRequestIdRef.current += 1;
// // // // //           loadingAfterShortsRef.current = false;
// // // // //           afterShortsPageRef.current = 2;
// // // // //           setAfterShortsRecommendations([]);
// // // // //           setHasMoreAfterShortsRecommendations(true);
// // // // //           setAfterShortsRecommendationsError("");
// // // // //           afterShortsTrendingPageRef.current = 2;
// // // // //           setHasMoreAfterShortsTrending(true);
// // // // //           setAfterShortsTrendingError("");
// // // // //         }

// // // // //         const addUnseenVideos = (videos, feedType) => {
// // // // //           const unique = [];
// // // // //           for (const item of videos) {
// // // // //             const id = item?.id == null ? "" : String(item.id);
// // // // //             if (!id || seenFeedVideoIdsRef.current.has(id)) continue;
// // // // //             seenFeedVideoIdsRef.current.add(id);
// // // // //             unique.push({ ...item, feedType });
// // // // //           }
// // // // //           return unique;
// // // // //         };

// // // // //         const initialTrending = tren
// // // // //           .filter((item) => {
// // // // //             const id = item?.id == null ? "" : String(item.id);
// // // // //             if (!id || seenTrendingVideoIdsRef.current.has(id)) return false;
// // // // //             seenTrendingVideoIdsRef.current.add(id);
// // // // //             seenFeedVideoIdsRef.current.add(id);
// // // // //             return true;
// // // // //           })
// // // // //           .map((item) => ({ ...item, feedType: "trending" }));

// // // // //         const mixed = [
// // // // //           ...(!append ? addUnseenVideos(rec, "recommended") : []),
// // // // //           ...(!append && tren.length
// // // // //             ? [
// // // // //                 {
// // // // //                   id: "trending-feed-heading",
// // // // //                   isFeedSectionHeader: true,
// // // // //                   title: "Trending Videos",
// // // // //                   feedType: "trending-header",
// // // // //                 },
// // // // //               ]
// // // // //             : []),
// // // // //           ...(!append ? initialTrending : []),
// // // // //         ];

// // // // //         setMixedFeed((current) => {
// // // // //           return append ? [...current, ...mixed] : mixed;
// // // // //         });
// // // // //         nextPageRef.current = latestPage;
// // // // //         setHasMore(
// // // // //           hasMoreVideoPages(
// // // // //             latestPayload,
// // // // //             latestPage,
// // // // //             FEED_PAGE_SIZE,
// // // // //             getArrayFromPayload(latestPayload).length,
// // // // //           ),
// // // // //         );
// // // // //       } catch (error) {
// // // // //         if (requestId !== homeLoadRequestIdRef.current) return;
// // // // //         console.warn("Home videos load error:", error);
// // // // //         setFeedLoadError(
// // // // //           error instanceof Error ? error.message : "Could not load videos.",
// // // // //         );
// // // // //       }
// // // // //     },
// // // // //     [selectedCategoryId],
// // // // //   );

// // // // //   const loadAfterShortsRecommendations = useCallback(
// // // // //     async (retry = false, force = false) => {
// // // // //       if (
// // // // //         (loadingAfterShortsRef.current && !force) ||
// // // // //         (!hasMoreAfterShortsRecommendations && !force) ||
// // // // //         (afterShortsRecommendationsError && !retry && !force)
// // // // //       ) {
// // // // //         return;
// // // // //       }

// // // // //       if (force) {
// // // // //         afterShortsRequestIdRef.current += 1;
// // // // //         loadingAfterShortsRef.current = false;
// // // // //       }
// // // // //       const requestId = ++afterShortsRequestIdRef.current;
// // // // //       loadingAfterShortsRef.current = true;
// // // // //       setLoadingAfterShortsRecommendations(true);
// // // // //       setAfterShortsRecommendationsError("");
// // // // //       try {
// // // // //         let attempts = 0;
// // // // //         let foundRecommendations = [];
// // // // //         let hasMorePages = true;

// // // // //         while (
// // // // //           requestId === afterShortsRequestIdRef.current &&
// // // // //           attempts < MAX_PAGES_PER_FEED_LOAD &&
// // // // //           hasMorePages &&
// // // // //           foundRecommendations.length < FEED_PAGE_SIZE
// // // // //         ) {
// // // // //           const page = afterShortsPageRef.current;
// // // // //           const payload = await fetchWithAuth("recommended", {
// // // // //             page,
// // // // //             limit: FEED_PAGE_SIZE,
// // // // //             category: selectedCategoryId || undefined,
// // // // //           });
// // // // //           const pageItems = getArrayFromPayload(payload).map(
// // // // //             normalizeVideoListItem,
// // // // //           );
// // // // //           if (requestId !== afterShortsRequestIdRef.current) return;
// // // // //           hasMorePages = hasMoreVideoPages(
// // // // //             payload,
// // // // //             page,
// // // // //             FEED_PAGE_SIZE,
// // // // //             pageItems.length,
// // // // //           );
// // // // //           afterShortsPageRef.current = page + 1;
// // // // //           attempts += 1;

// // // // //           const shortsIds = new Set(
// // // // //             shorts.map((item) => (item?.id == null ? "" : String(item.id))),
// // // // //           );
// // // // //           for (const item of pageItems) {
// // // // //             if (foundRecommendations.length >= FEED_PAGE_SIZE) break;
// // // // //             const id = item?.id == null ? "" : String(item.id);
// // // // //             if (
// // // // //               !id ||
// // // // //               shortsIds.has(id) ||
// // // // //               seenFeedVideoIdsRef.current.has(id)
// // // // //             ) {
// // // // //               continue;
// // // // //             }
// // // // //             seenFeedVideoIdsRef.current.add(id);
// // // // //             foundRecommendations.push({
// // // // //               ...item,
// // // // //               feedType: "recommended-after-shorts",
// // // // //             });
// // // // //           }
// // // // //         }

// // // // //         if (requestId === afterShortsRequestIdRef.current) {
// // // // //           setAfterShortsRecommendations((current) => [
// // // // //             ...current,
// // // // //             ...foundRecommendations,
// // // // //           ]);
// // // // //           setHasMoreAfterShortsRecommendations(hasMorePages);
// // // // //         }
// // // // //       } catch (error) {
// // // // //         if (requestId !== afterShortsRequestIdRef.current) return;
// // // // //         console.warn("More recommended videos load error:", error);
// // // // //         setAfterShortsRecommendationsError(
// // // // //           error instanceof Error
// // // // //             ? error.message
// // // // //             : "Could not load more recommended videos.",
// // // // //         );
// // // // //       } finally {
// // // // //         if (requestId === afterShortsRequestIdRef.current) {
// // // // //           loadingAfterShortsRef.current = false;
// // // // //           setLoadingAfterShortsRecommendations(false);
// // // // //         }
// // // // //       }
// // // // //     },
// // // // //     [
// // // // //       afterShortsRecommendationsError,
// // // // //       hasMoreAfterShortsRecommendations,
// // // // //       selectedCategoryId,
// // // // //       shorts,
// // // // //     ],
// // // // //   );
// // // // //   loadAfterShortsRecommendationsRef.current = loadAfterShortsRecommendations;

// // // // //   const loadAfterShortsTrending = useCallback(
// // // // //     async (retry = false, force = false) => {
// // // // //       if (
// // // // //         (loadingAfterShortsTrendingRef.current && !force) ||
// // // // //         (!hasMoreAfterShortsTrending && !force) ||
// // // // //         (afterShortsTrendingError && !retry && !force)
// // // // //       ) {
// // // // //         return;
// // // // //       }

// // // // //       if (force) {
// // // // //         afterShortsTrendingRequestIdRef.current += 1;
// // // // //         loadingAfterShortsTrendingRef.current = false;
// // // // //         afterShortsTrendingPageRef.current = 2;
// // // // //         setHasMoreAfterShortsTrending(true);
// // // // //       }
// // // // //       const requestId = ++afterShortsTrendingRequestIdRef.current;
// // // // //       loadingAfterShortsTrendingRef.current = true;
// // // // //       setLoadingAfterShortsTrending(true);
// // // // //       setAfterShortsTrendingError("");
// // // // //       try {
// // // // //         let attempts = 0;
// // // // //         let foundTrending = [];
// // // // //         let hasMorePages = true;

// // // // //         while (
// // // // //           requestId === afterShortsTrendingRequestIdRef.current &&
// // // // //           attempts < MAX_PAGES_PER_FEED_LOAD &&
// // // // //           hasMorePages &&
// // // // //           foundTrending.length < TRENDING_HOME_LIMIT
// // // // //         ) {
// // // // //           const page = afterShortsTrendingPageRef.current;
// // // // //           const payload = await fetchWithAuth("trending", {
// // // // //             page,
// // // // //             limit: TRENDING_HOME_LIMIT,
// // // // //             category: selectedCategoryId || undefined,
// // // // //           });
// // // // //           const pageItems = getArrayFromPayload(payload).map(
// // // // //             normalizeVideoListItem,
// // // // //           );
// // // // //           if (requestId !== afterShortsTrendingRequestIdRef.current) return;
// // // // //           hasMorePages = hasMoreVideoPages(
// // // // //             payload,
// // // // //             page,
// // // // //             TRENDING_HOME_LIMIT,
// // // // //             pageItems.length,
// // // // //           );
// // // // //           afterShortsTrendingPageRef.current = page + 1;
// // // // //           attempts += 1;

// // // // //           for (const item of pageItems) {
// // // // //             if (foundTrending.length >= TRENDING_HOME_LIMIT) break;
// // // // //             const id = item?.id == null ? "" : String(item.id);
// // // // //             if (!id || seenTrendingVideoIdsRef.current.has(id)) continue;
// // // // //             seenTrendingVideoIdsRef.current.add(id);
// // // // //             foundTrending.push({ ...item, feedType: "trending-after-shorts" });
// // // // //           }
// // // // //         }

// // // // //         if (requestId === afterShortsTrendingRequestIdRef.current) {
// // // // //           setMixedFeed((current) => {
// // // // //             const next = [...current];
// // // // //             const latestHeaderIndex = next.findIndex(
// // // // //               (item) => item.feedType === "latest-header",
// // // // //             );
// // // // //             const insertAt =
// // // // //               latestHeaderIndex === -1 ? next.length : latestHeaderIndex;
// // // // //             next.splice(insertAt, 0, ...foundTrending);
// // // // //             return next;
// // // // //           });
// // // // //           setHasMoreAfterShortsTrending(hasMorePages);
// // // // //         }
// // // // //       } catch (error) {
// // // // //         if (requestId !== afterShortsTrendingRequestIdRef.current) return;
// // // // //         console.warn("More trending videos load error:", error);
// // // // //         setAfterShortsTrendingError(
// // // // //           error instanceof Error
// // // // //             ? error.message
// // // // //             : "Could not load more trending videos.",
// // // // //         );
// // // // //       } finally {
// // // // //         if (requestId === afterShortsTrendingRequestIdRef.current) {
// // // // //           loadingAfterShortsTrendingRef.current = false;
// // // // //           setLoadingAfterShortsTrending(false);
// // // // //         }
// // // // //       }
// // // // //     },
// // // // //     [
// // // // //       afterShortsTrendingError,
// // // // //       hasMoreAfterShortsTrending,
// // // // //       selectedCategoryId,
// // // // //     ],
// // // // //   );
// // // // //   loadAfterShortsTrendingRef.current = loadAfterShortsTrending;

// // // // //   const loadMoreRecommendedAndTrending = useCallback(
// // // // //     async () => {
// // // // //       await loadAfterShortsRecommendations();
// // // // //       await loadAfterShortsTrending();
// // // // //     },
// // // // //     [loadAfterShortsRecommendations, loadAfterShortsTrending],
// // // // //   );

// // // // //   useEffect(() => {
// // // // //     let active = true;
// // // // //     const init = async () => {
// // // // //       setLoading(true);
// // // // //       nextPageRef.current = 1;
// // // // //       setHasMore(true);
// // // // //       await loadHomeData();
// // // // //       if (!active) return;
// // // // //       setLoading(false);
// // // // //       await loadAfterShortsRecommendationsRef.current?.(false, true);
// // // // //       await loadAfterShortsTrendingRef.current?.(false, true);
// // // // //     };
// // // // //     init();
// // // // //     return () => {
// // // // //       active = false;
// // // // //     };
// // // // //   }, [loadHomeData]);

// // // // //   useEffect(() => {
// // // // //     if (selectedCategoryId) {
// // // // //       // Backend category filter support hone pe yahan call karo
// // // // //     }
// // // // //   }, [selectedCategoryId]);

// // // // //   useEffect(() => {
// // // // //     let active = true;
// // // // //     let currentSocket;
// // // // //     let viewHandler;

// // // // //     getViewSocket().then((socket) => {
// // // // //       if (!active || !socket) return;
// // // // //       currentSocket = socket;
// // // // //       const handleViewCountUpdated = ({ videoId, views }) => {
// // // // //         const updateViews = (items) =>
// // // // //           items.map((item) =>
// // // // //             String(item.id) === String(videoId) ? { ...item, views } : item,
// // // // //           );

// // // // //         setRecommended(updateViews);
// // // // //         setTrending(updateViews);
// // // // //         setLatest(updateViews);
// // // // //         setMixedFeed(updateViews);
// // // // //         setShorts((items) =>
// // // // //           items.map((item) =>
// // // // //             String(item.id) === String(videoId) ? { ...item, views } : item,
// // // // //           ),
// // // // //         );
// // // // //       };
// // // // //       socket.on("view-count-updated", handleViewCountUpdated);

// // // // //       viewHandler = handleViewCountUpdated;
// // // // //     });

// // // // //     return () => {
// // // // //       active = false;
// // // // //       if (currentSocket && viewHandler) {
// // // // //         currentSocket.off("view-count-updated", viewHandler);
// // // // //       }
// // // // //     };
// // // // //   }, []);

// // // // //   const onRefresh = async () => {
// // // // //     setRefreshing(true);
// // // // //     nextPageRef.current = 1;
// // // // //     setHasMore(true);
// // // // //     setActiveVideoId(null); // stop any playing preview
// // // // //     try {
// // // // //       await loadHomeData();
// // // // //       await loadAfterShortsRecommendationsRef.current?.(false, true);
// // // // //       await loadAfterShortsTrendingRef.current?.(false, true);
// // // // //     } finally {
// // // // //       setRefreshing(false);
// // // // //     }
// // // // //   };

// // // // //   const loadMoreFeed = async (retry = false) => {
// // // // //     if (
// // // // //       loading ||
// // // // //       loadingMoreRef.current ||
// // // // //       !hasMore ||
// // // // //       (feedLoadError && !retry)
// // // // //     ) {
// // // // //       return;
// // // // //     }

// // // // //     loadingMoreRef.current = true;
// // // // //     setLoadingMore(true);
// // // // //     try {
// // // // //       await loadHomeData(nextPageRef.current + 1, true);
// // // // //     } finally {
// // // // //       loadingMoreRef.current = false;
// // // // //       setLoadingMore(false);
// // // // //     }
// // // // //   };

// // // // //   const retryHomeFeed = async () => {
// // // // //     setLoading(true);
// // // // //     try {
// // // // //       await loadHomeData(1, false);
// // // // //       await loadAfterShortsRecommendationsRef.current?.(false, true);
// // // // //       await loadAfterShortsTrendingRef.current?.(false, true);
// // // // //     } finally {
// // // // //       setLoading(false);
// // // // //     }
// // // // //   };

// // // // //   const handleItemClick = (item) => {
// // // // //     // Stop preview when navigating
// // // // //     setActiveVideoId(null);

// // // // //     if (item?.isChannel) {
// // // // //       navigation.navigate("SubscribedChannels", { id: item.id });
// // // // //       return;
// // // // //     }

// // // // //     if (isShortContent(item)) {
// // // // //       navigation.navigate("MainTabs", {
// // // // //         screen: "Shorts",
// // // // //         params: { video: item },
// // // // //       });
// // // // //       return;
// // // // //     }

// // // // //     navigation.navigate("VideoDetail", {
// // // // //       id: item.id,
// // // // //       item,
// // // // //       video: item,
// // // // //     });
// // // // //   };

// // // // //   const handleSectionPress = (type) => {
// // // // //     navigation.navigate("ViewAll", { type });
// // // // //   };

// // // // //   const handleAddToWatchLater = async (item) => {
// // // // //     try {
// // // // //       const token = await AsyncStorage.getItem("token");
// // // // //       if (!token) {
// // // // //         Toast.show({ type: "error", text1: "Please login first" });
// // // // //         return { success: false };
// // // // //       }

// // // // //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// // // // //         method: "POST",
// // // // //         headers: {
// // // // //           Authorization: `Bearer ${token}`,
// // // // //           "Content-Type": "application/json",
// // // // //         },
// // // // //       });

// // // // //       const data = await res.json().catch(() => ({}));

// // // // //       if (data.success) {
// // // // //         Toast.show({
// // // // //           type: "success",
// // // // //           text1: data.message || "Added to Watch Later",
// // // // //         });
// // // // //         return { success: true };
// // // // //       } else {
// // // // //         Toast.show({
// // // // //           type: "error",
// // // // //           text1: data.message || "Failed to add",
// // // // //         });
// // // // //         return { success: false };
// // // // //       }
// // // // //     } catch (err) {
// // // // //       console.error("Add to Watch Later error:", err);
// // // // //       Toast.show({ type: "error", text1: "Something went wrong" });
// // // // //       return { success: false };
// // // // //     }
// // // // //   };

// // // // //   const handleRemoveFromWatchLater = async (item) => {
// // // // //     try {
// // // // //       const token = await AsyncStorage.getItem("token");
// // // // //       if (!token) {
// // // // //         Toast.show({ type: "error", text1: "Please login first" });
// // // // //         return { success: false };
// // // // //       }

// // // // //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// // // // //         method: "DELETE",
// // // // //         headers: {
// // // // //           Authorization: `Bearer ${token}`,
// // // // //         },
// // // // //       });
// // // // //       const data = await res.json().catch(() => ({}));
// // // // //       if (!res.ok || data?.success === false) {
// // // // //         throw new Error(data?.message || "Could not remove from Watch Later.");
// // // // //       }

// // // // //       Toast.show({
// // // // //         type: "success",
// // // // //         text1: data.message || "Removed from Watch Later",
// // // // //       });
// // // // //       return { success: true };
// // // // //     } catch (error) {
// // // // //       console.warn("Remove from Watch Later error:", error);
// // // // //       Toast.show({
// // // // //         type: "error",
// // // // //         text1:
// // // // //           error instanceof Error
// // // // //             ? error.message
// // // // //             : "Could not remove from Watch Later.",
// // // // //       });
// // // // //       return { success: false };
// // // // //     }
// // // // //   };

// // // // //   // ──── Horizontal Videos Section ────
// // // // //   const renderHorizontalSection = (
// // // // //     title,
// // // // //     data,
// // // // //     emptyMsg,
// // // // //     type = "recommended",
// // // // //     twoColumn = false,
// // // // //   ) => (
// // // // //     <View style={styles.section}>
// // // // //       <SectionHeader title={title} onPress={() => handleSectionPress(type)} />

// // // // //       {loading && data.length === 0 ? (
// // // // //         <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
// // // // //       ) : data.length > 0 ? (
// // // // //         <ScrollView
// // // // //           horizontal
// // // // //           showsHorizontalScrollIndicator={false}
// // // // //           decelerationRate="fast"
// // // // //           snapToInterval={twoColumn ? TWO_CARD_SNAP_INTERVAL : undefined}
// // // // //           snapToAlignment="start"
// // // // //           disableIntervalMomentum={twoColumn}
// // // // //           contentContainerStyle={[
// // // // //             styles.horizontalList,
// // // // //             twoColumn && styles.twoColumnList,
// // // // //           ]}
// // // // //         >
// // // // //           {data.map((item) => (
// // // // //             <MovieCard
// // // // //               key={item.id}
// // // // //               item={item}
// // // // //               onPress={handleItemClick}
// // // // //               onAddToWatchLater={handleAddToWatchLater}
// // // // //               onRemoveFromWatchLater={handleRemoveFromWatchLater}
// // // // //               twoColumn={twoColumn}
// // // // //             />
// // // // //           ))}
// // // // //         </ScrollView>
// // // // //       ) : (
// // // // //         <Text style={styles.emptyText}>{emptyMsg}</Text>
// // // // //       )}
// // // // //     </View>
// // // // //   );

// // // // //   // ──── Shorts Grid ────
// // // // //   const renderShortsGrid = (title) => (
// // // // //     <View style={[styles.section, { marginBottom: 36 }]}>
// // // // //       <SectionHeader
// // // // //         title={title}
// // // // //         onPress={() => handleSectionPress("shorts")}
// // // // //       />

// // // // //       {loading && shorts.length === 0 ? (
// // // // //         <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
// // // // //       ) : shorts.length > 0 ? (
// // // // //         <View style={styles.shortsGrid}>
// // // // //           {shorts.map((item) => (
// // // // //             <TouchableOpacity
// // // // //               key={item.id}
// // // // //               style={styles.shortCard}
// // // // //               onPress={() => handleItemClick(item)}
// // // // //               activeOpacity={0.9}
// // // // //             >
// // // // //               <View style={styles.shortImageWrapper}>
// // // // //                 <Image
// // // // //                   source={{
// // // // //                     uri:
// // // // //                       item.thumbnail ||
// // // // //                       item.thumb ||
// // // // //                       "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // // //                   }}
// // // // //                   style={styles.shortImage}
// // // // //                   resizeMode="cover"
// // // // //                 />
// // // // //                 <View style={styles.shortOverlay}>
// // // // //                   <Text style={styles.shortTitle} numberOfLines={2}>
// // // // //                     {item.title}
// // // // //                   </Text>
// // // // //                   <Text style={styles.shortViews}>
// // // // //                     {Number(item.views || 0).toLocaleString()} views
// // // // //                   </Text>
// // // // //                 </View>
// // // // //               </View>
// // // // //             </TouchableOpacity>
// // // // //           ))}
// // // // //         </View>
// // // // //       ) : (
// // // // //         <Text style={styles.emptyText}>No shorts available right now.</Text>
// // // // //       )}
// // // // //     </View>
// // // // //   );

// // // // //   // ──── YouTube-style Vertical Mixed Feed Card (with autoplay) ────
// // // // //   const renderVerticalFeedItem = ({ item }) => {
// // // // //     if (item.isFeedEmptyMessage) {
// // // // //       return <Text style={styles.emptyText}>{item.title}</Text>;
// // // // //     }

// // // // //     if (item.isFeedSectionHeader) {
// // // // //       return (
// // // // //         <View style={styles.feedSectionHeader}>
// // // // //           <SectionHeader
// // // // //             title={item.title}
// // // // //             onPress={() =>
// // // // //               handleSectionPress(item.sectionType || "trending")
// // // // //             }
// // // // //           />
// // // // //         </View>
// // // // //       );
// // // // //     }

// // // // //     const isActive =
// // // // //       isFocused && activeVideoId === item.id && !!item.videoUrl;
// // // // //     const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));

// // // // //     return (
// // // // //       <TouchableOpacity
// // // // //         activeOpacity={0.9}
// // // // //         onPress={() => handleItemClick(item)}
// // // // //         style={styles.verticalCard}
// // // // //       >
// // // // //         <View style={styles.verticalThumbWrapper}>
// // // // //           {isActive ? (
// // // // //             <AutoplayPreview uri={item.videoUrl} style={styles.verticalThumb} />
// // // // //           ) : (
// // // // //             <Image
// // // // //               source={{ uri: item.thumb || item.thumbnail }}
// // // // //               style={styles.verticalThumb}
// // // // //               resizeMode="cover"
// // // // //             />
// // // // //           )}

// // // // //           {/* Progress bar */}
// // // // //           {progress > 0 && (
// // // // //             <View style={styles.progressBarContainer}>
// // // // //               <View
// // // // //                 style={[styles.progressBarFill, { width: `${progress}%` }]}
// // // // //               />
// // // // //             </View>
// // // // //           )}

// // // // //           {/* Muted badge when autoplaying */}
// // // // //           {isActive && (
// // // // //             <View style={styles.mutedBadge}>
// // // // //               <Text style={styles.mutedText}>🔇</Text>
// // // // //             </View>
// // // // //           )}
// // // // //         </View>

// // // // //         <View style={styles.verticalInfo}>
// // // // //           <Text style={styles.verticalTitle} numberOfLines={2}>
// // // // //             {item.title}
// // // // //           </Text>
// // // // //           <Text style={styles.verticalMeta}>
// // // // //             {(item.views || 0).toLocaleString()} views
// // // // //             {item.channel?.name ? ` • ${item.channel.name}` : ""}
// // // // //           </Text>
// // // // //         </View>
// // // // //       </TouchableOpacity>
// // // // //     );
// // // // //   };

// // // // //   const videosAlreadyShown = new Set<string>();
// // // // //   for (const item of [...mixedFeed, ...afterShortsRecommendations, ...shorts]) {
// // // // //     if (!item?.id || item.isFeedSectionHeader || item.isFeedEmptyMessage) {
// // // // //       continue;
// // // // //     }
// // // // //     videosAlreadyShown.add(String(item.id));
// // // // //   }
// // // // //   const uniqueLatestVideos = latest.filter(
// // // // //     (item) => item?.id && !videosAlreadyShown.has(String(item.id)),
// // // // //   );

// // // // //   return (
// // // // //     <View style={styles.container}>
// // // // //       <StatusBar barStyle="light-content" backgroundColor="#000" />
// // // // //       <Navbar onMenuPress={() => {}} points={0} />

// // // // //       <TopicChips
// // // // //         onTopicChange={(topic, categoryId) => {
// // // // //           setSelectedTopic(topic);
// // // // //           setSelectedCategoryId(categoryId || null);
// // // // //         }}
// // // // //       />

// // // // //       <FlatList
// // // // //         data={mixedFeed}
// // // // //         keyExtractor={(item, index) => `${item.id}-${index}`}
// // // // //         renderItem={renderVerticalFeedItem}
// // // // //         showsVerticalScrollIndicator={false}
// // // // //         contentContainerStyle={styles.scrollContent}
// // // // //         onEndReached={() =>
// // // // //           hasMore
// // // // //             ? loadMoreFeed()
// // // // //             : loadMoreRecommendedAndTrending()
// // // // //         }
// // // // //         onEndReachedThreshold={0.6}
// // // // //         // YouTube-style autoplay when scroll stops
// // // // //         onViewableItemsChanged={onViewableItemsChanged}
// // // // //         viewabilityConfig={viewabilityConfig}
// // // // //         ListHeaderComponent={
// // // // //           <View style={styles.section}>
// // // // //             <SectionHeader
// // // // //               title="Recommended for you"
// // // // //               onPress={() => handleSectionPress("recommended")}
// // // // //             />
// // // // //             {loading && mixedFeed.length === 0 && (
// // // // //               <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
// // // // //             )}
// // // // //             {!loading && mixedFeed.length === 0 && (
// // // // //               feedLoadError ? (
// // // // //                 <TouchableOpacity onPress={retryHomeFeed}>
// // // // //                   <Text style={styles.emptyText}>
// // // // //                     {feedLoadError} Tap to retry.
// // // // //                   </Text>
// // // // //                 </TouchableOpacity>
// // // // //               ) : (
// // // // //                 <Text style={styles.emptyText}>
// // // // //                   No recommendations available right now.
// // // // //                 </Text>
// // // // //               )
// // // // //             )}
// // // // //           </View>
// // // // //         }
// // // // //         ListFooterComponent={
// // // // //           <>
// // // // //             {loadingMore && (
// // // // //               <ActivityIndicator color="#fff" style={styles.loadingMore} />
// // // // //             )}
// // // // //             {feedLoadError && mixedFeed.length > 0 && (
// // // // //               <TouchableOpacity
// // // // //                 onPress={() => loadMoreFeed(true)}
// // // // //                 style={{ alignItems: "center", padding: 16 }}
// // // // //               >
// // // // //                 <Text style={styles.emptyText}>
// // // // //                   {feedLoadError} Tap to retry.
// // // // //                 </Text>
// // // // //               </TouchableOpacity>
// // // // //             )}
// // // // //             {renderShortsGrid("Trending Shorts")}
// // // // //             {renderHorizontalSection(
// // // // //               "From Your Subscriptions",
// // // // //               subscriptions,
// // // // //               "Subscribe to channels to see their videos here.",
// // // // //               "subscriptions",
// // // // //             )}
// // // // //             {renderShortsGrid("Top Shorts")}
// // // // //             <View style={styles.section}>
// // // // //               <SectionHeader
// // // // //                 title="Recommended for you"
// // // // //                 onPress={() => handleSectionPress("recommended")}
// // // // //               />
// // // // //               {afterShortsRecommendations.map((item) => (
// // // // //                 <View key={item.id}>
// // // // //                   {renderVerticalFeedItem({ item })}
// // // // //                 </View>
// // // // //               ))}
// // // // //               {loadingAfterShortsRecommendations && (
// // // // //                 <ActivityIndicator color="#fff" style={styles.loadingMore} />
// // // // //               )}
// // // // //               {afterShortsRecommendationsError ? (
// // // // //                 <TouchableOpacity
// // // // //                   onPress={() => loadAfterShortsRecommendations(true)}
// // // // //                   style={{ alignItems: "center", padding: 16 }}
// // // // //                 >
// // // // //                   <Text style={styles.emptyText}>
// // // // //                     {afterShortsRecommendationsError} Tap to retry.
// // // // //                   </Text>
// // // // //                 </TouchableOpacity>
// // // // //               ) : null}
// // // // //               {!loadingAfterShortsRecommendations &&
// // // // //                 !hasMoreAfterShortsRecommendations &&
// // // // //                 afterShortsRecommendations.length === 0 && (
// // // // //                   <Text style={styles.emptyText}>
// // // // //                     No more unseen recommended videos available.
// // // // //                   </Text>
// // // // //                 )}
// // // // //             </View>
// // // // //             {renderHorizontalSection(
// // // // //               "Latest Videos",
// // // // //               uniqueLatestVideos,
// // // // //               "No unique latest videos available right now.",
// // // // //               "latest",
// // // // //             )}
// // // // //             {loadingAfterShortsTrending && (
// // // // //               <ActivityIndicator color="#fff" style={styles.loadingMore} />
// // // // //             )}
// // // // //             {afterShortsTrendingError ? (
// // // // //               <TouchableOpacity
// // // // //                 onPress={() => loadAfterShortsTrending(true)}
// // // // //                 style={{ alignItems: "center", padding: 16 }}
// // // // //               >
// // // // //                 <Text style={styles.emptyText}>
// // // // //                   {afterShortsTrendingError} Tap to retry.
// // // // //                 </Text>
// // // // //               </TouchableOpacity>
// // // // //             ) : null}
// // // // //           </>
// // // // //         }
// // // // //         refreshControl={
// // // // //           <RefreshControl
// // // // //             refreshing={refreshing}
// // // // //             onRefresh={onRefresh}
// // // // //             tintColor="#fff"
// // // // //             colors={["#fff"]}
// // // // //           />
// // // // //         }
// // // // //       />
// // // // //     </View>
// // // // //   );
// // // // // }

// // // // // // ────────────────────────────────────────────────
// // // // // // Styles
// // // // // // ────────────────────────────────────────────────
// // // // // const styles = StyleSheet.create({
// // // // //   container: {
// // // // //     flex: 1,
// // // // //     backgroundColor: "#000",
// // // // //   },
// // // // //   scrollContent: {
// // // // //     paddingTop: 12,
// // // // //     paddingBottom: 60,
// // // // //     paddingHorizontal: 16,
// // // // //   },
// // // // //   section: {
// // // // //     marginBottom: 28,
// // // // //   },
// // // // //   feedSectionHeader: {
// // // // //     marginTop: 12,
// // // // //     marginBottom: 4,
// // // // //   },
// // // // //   sectionHeader: {
// // // // //     flexDirection: "row",
// // // // //     alignItems: "center",
// // // // //     marginBottom: 14,
// // // // //     gap: 6,
// // // // //   },
// // // // //   sectionTitle: {
// // // // //     color: "#fff",
// // // // //     fontSize: 18,
// // // // //     fontWeight: "700",
// // // // //     marginBottom: 12,
// // // // //   },
// // // // //   horizontalList: {
// // // // //     paddingRight: 12,
// // // // //     gap: CARD_GAP,
// // // // //   },
// // // // //   twoColumnList: {
// // // // //     paddingRight: 16,
// // // // //   },

// // // // //   // ===== Horizontal Card (fixed title) =====
// // // // //   cardWrapper: {
// // // // //     width: CARD_WIDTH,
// // // // //     marginRight: 4,
// // // // //   },
// // // // //   twoColumnCardWrapper: {
// // // // //     marginRight: 0,
// // // // //   },
// // // // //   card: {
// // // // //     width: CARD_WIDTH,
// // // // //     height: CARD_HEIGHT,
// // // // //     borderRadius: 10,
// // // // //     overflow: "hidden",
// // // // //     backgroundColor: "#18181b",
// // // // //   },
// // // // //   cardImage: {
// // // // //     width: "100%",
// // // // //     height: "100%",
// // // // //   },
// // // // //   cardOverlay: {
// // // // //     ...StyleSheet.absoluteFill,
// // // // //     backgroundColor: "rgba(0,0,0,0.25)",
// // // // //     justifyContent: "flex-end",
// // // // //     padding: 8,
// // // // //   },
// // // // //   durationBadge: {
// // // // //     position: "absolute",
// // // // //     right: 7,
// // // // //     bottom: 7,
// // // // //     zIndex: 2,
// // // // //     borderRadius: 4,
// // // // //     paddingHorizontal: 6,
// // // // //     paddingVertical: 3,
// // // // //     backgroundColor: "rgba(0,0,0,0.8)",
// // // // //   },
// // // // //   durationText: {
// // // // //     color: "#fff",
// // // // //     fontSize: 10,
// // // // //     fontWeight: "600",
// // // // //   },
// // // // //   cardActions: {
// // // // //     flexDirection: "row",
// // // // //     gap: 8,
// // // // //   },
// // // // //   actionBtnWhite: {
// // // // //     width: 30,
// // // // //     height: 30,
// // // // //     borderRadius: 15,
// // // // //     backgroundColor: "#fff",
// // // // //     alignItems: "center",
// // // // //     justifyContent: "center",
// // // // //   },
// // // // //   actionBtnBorder: {
// // // // //     width: 30,
// // // // //     height: 30,
// // // // //     borderRadius: 15,
// // // // //     borderWidth: 1.5,
// // // // //     borderColor: "rgba(255,255,255,0.7)",
// // // // //     alignItems: "center",
// // // // //     justifyContent: "center",
// // // // //   },
// // // // //   cardInfo: {
// // // // //     flexDirection: "row",
// // // // //     alignItems: "flex-start",
// // // // //     gap: 10,
// // // // //     marginTop: 10,
// // // // //   },
// // // // //   channelAvatar: {
// // // // //     width: 38,
// // // // //     height: 38,
// // // // //     borderRadius: 19,
// // // // //     overflow: "hidden",
// // // // //     backgroundColor: "#3f3f46",
// // // // //     alignItems: "center",
// // // // //     justifyContent: "center",
// // // // //   },
// // // // //   channelAvatarImage: {
// // // // //     width: "100%",
// // // // //     height: "100%",
// // // // //   },
// // // // //   channelAvatarInitial: {
// // // // //     color: "#fff",
// // // // //     fontSize: 15,
// // // // //     fontWeight: "600",
// // // // //   },
// // // // //   cardTextInfo: {
// // // // //     flex: 1,
// // // // //     minWidth: 0,
// // // // //   },
// // // // //   cardTitle: {
// // // // //     color: "#fff",
// // // // //     fontSize: 14,
// // // // //     fontWeight: "600",
// // // // //     lineHeight: 19,
// // // // //   },
// // // // //   channelNameRow: {
// // // // //     flexDirection: "row",
// // // // //     alignItems: "center",
// // // // //     gap: 4,
// // // // //     marginTop: 3,
// // // // //   },
// // // // //   channelName: {
// // // // //     flexShrink: 1,
// // // // //     color: "#a1a1aa",
// // // // //     fontSize: 12,
// // // // //   },
// // // // //   progressBarContainer: {
// // // // //     position: "absolute",
// // // // //     bottom: 0,
// // // // //     left: 0,
// // // // //     right: 0,
// // // // //     height: 3,
// // // // //     backgroundColor: "rgba(0,0,0,0.5)",
// // // // //   },
// // // // //   progressBarFill: {
// // // // //     height: "100%",
// // // // //     backgroundColor: "#dc2626",
// // // // //   },
// // // // //   viewsText: {
// // // // //     color: "#a1a1aa",
// // // // //     fontSize: 12,
// // // // //     marginTop: 2,
// // // // //   },
// // // // //   emptyText: {
// // // // //     color: "#a1a1aa",
// // // // //     fontSize: 14,
// // // // //     marginTop: 8,
// // // // //   },
// // // // //   loadingMore: {
// // // // //     marginVertical: 20,
// // // // //   },

// // // // //   // ===== Shorts =====
// // // // //   shortsGrid: {
// // // // //     flexDirection: "row",
// // // // //     flexWrap: "wrap",
// // // // //     justifyContent: "space-between",
// // // // //     rowGap: 14,
// // // // //   },
// // // // //   shortCard: {
// // // // //     width: SHORT_WIDTH,
// // // // //   },
// // // // //   shortImageWrapper: {
// // // // //     width: SHORT_WIDTH,
// // // // //     height: SHORT_HEIGHT,
// // // // //     borderRadius: 12,
// // // // //     overflow: "hidden",
// // // // //     backgroundColor: "#18181b",
// // // // //   },
// // // // //   shortImage: {
// // // // //     width: "100%",
// // // // //     height: "100%",
// // // // //   },
// // // // //   shortOverlay: {
// // // // //     position: "absolute",
// // // // //     bottom: 0,
// // // // //     left: 0,
// // // // //     right: 0,
// // // // //     padding: 10,
// // // // //     backgroundColor: "rgba(0,0,0,0.55)",
// // // // //   },
// // // // //   shortTitle: {
// // // // //     color: "#fff",
// // // // //     fontSize: 13,
// // // // //     fontWeight: "600",
// // // // //     lineHeight: 17,
// // // // //   },
// // // // //   shortViews: {
// // // // //     color: "#cccccc",
// // // // //     fontSize: 11,
// // // // //     marginTop: 4,
// // // // //   },

// // // // //   // ===== YouTube-style Vertical Feed =====
// // // // //   verticalCard: {
// // // // //     marginBottom: 20,
// // // // //   },
// // // // //   verticalThumbWrapper: {
// // // // //     width: "100%",
// // // // //     aspectRatio: 16 / 9,
// // // // //     borderRadius: 12,
// // // // //     overflow: "hidden",
// // // // //     backgroundColor: "#18181b",
// // // // //   },
// // // // //   verticalThumb: {
// // // // //     width: "100%",
// // // // //     height: "100%",
// // // // //   },
// // // // //   verticalInfo: {
// // // // //     marginTop: 10,
// // // // //     paddingHorizontal: 2,
// // // // //   },
// // // // //   verticalTitle: {
// // // // //     color: "#fff",
// // // // //     fontSize: 15,
// // // // //     fontWeight: "600",
// // // // //     lineHeight: 20,
// // // // //   },
// // // // //   verticalMeta: {
// // // // //     color: "#a1a1aa",
// // // // //     fontSize: 13,
// // // // //     marginTop: 4,
// // // // //   },

// // // // //   // Autoplay muted badge
// // // // //   mutedBadge: {
// // // // //     position: "absolute",
// // // // //     top: 10,
// // // // //     right: 10,
// // // // //     backgroundColor: "rgba(0,0,0,0.65)",
// // // // //     borderRadius: 12,
// // // // //     paddingHorizontal: 8,
// // // // //     paddingVertical: 4,
// // // // //   },
// // // // //   mutedText: {
// // // // //     color: "#fff",
// // // // //     fontSize: 13,
// // // // //   },
// // // // // });


// // // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // // import {
// // // //   View,
// // // //   Text,
// // // //   Image,
// // // //   ScrollView,
// // // //   TouchableOpacity,
// // // //   StyleSheet,
// // // //   Dimensions,
// // // //   ActivityIndicator,
// // // //   StatusBar,
// // // //   RefreshControl,
// // // //   FlatList,
// // // // } from "react-native";
// // // // import { useIsFocused, useNavigation } from "@react-navigation/native";
// // // // import { VideoView, useVideoPlayer } from "expo-video";
// // // // import {
// // // //   BadgeCheck,
// // // //   ChevronRight,
// // // //   Play,
// // // //   Plus,
// // // //   Check,
// // // // } from "lucide-react-native";
// // // // import Toast from "react-native-toast-message";
// // // // import AsyncStorage from "@react-native-async-storage/async-storage";
// // // // import Navbar from "./Navbar";
// // // // import TopicChips from "./TopicChips";
// // // // import { getViewSocket } from "../utils/viewSocket";
// // // // import { API_ORIGIN } from "../../config/api";

// // // // const { width: SCREEN_WIDTH } = Dimensions.get("window");

// // // // const CARD_WIDTH = SCREEN_WIDTH * 0.42;
// // // // const CARD_HEIGHT = CARD_WIDTH * (9 / 16);
// // // // const SHORT_WIDTH = (SCREEN_WIDTH - 44) / 2;
// // // // const SHORT_HEIGHT = SHORT_WIDTH * (16 / 9);
// // // // const CARD_GAP = 14;

// // // // const BACKEND_URL = API_ORIGIN;
// // // // const API_BASE = `${BACKEND_URL}/api/uservideo`;
// // // // const LIMIT = 5;
// // // // const MAX_PAGES = 30;

// // // // const hasMorePages = (payload: any, page: number, limit: number, count: number) => {
// // // //   if (typeof payload?.hasMore === "boolean") return payload.hasMore;
// // // //   const total = Number(payload?.total ?? payload?.pagination?.total);
// // // //   if (Number.isFinite(total)) return total > page * limit;
// // // //   return count >= limit;
// // // // };

// // // // function AutoplayPreview({ uri, style }: { uri: string; style: any }) {
// // // //   const player = useVideoPlayer(uri, (p) => {
// // // //     p.loop = true;
// // // //     p.muted = true;
// // // //     p.play();
// // // //   });
// // // //   return (
// // // //     <VideoView
// // // //       player={player}
// // // //       style={style}
// // // //       contentFit="cover"
// // // //       nativeControls={false}
// // // //       allowsPictureInPicture={false}
// // // //     />
// // // //   );
// // // // }

// // // // const toMediaUrl = (value: any, fallback: string) => {
// // // //   if (!value) return fallback;
// // // //   const path = String(value).replace(/\\/g, "/");
// // // //   if (/^https?:\/\//i.test(path)) return path;
// // // //   return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
// // // // };

// // // // const normalizeVideo = (video: any = {}) => ({
// // // //   id: video._id || video.id,
// // // //   title: video.title || "Untitled video",
// // // //   thumb: toMediaUrl(video.thumbnail, "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"),
// // // //   thumbnail: toMediaUrl(video.thumbnail, "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"),
// // // //   views: Number(video.views ?? video.viewCount ?? 0),
// // // //   likesCount: Number(video.likesCount ?? video.likes ?? 0),
// // // //   videoUrl: toMediaUrl(video.videoUrl, ""),
// // // //   videoType: video.videoType || null,
// // // //   channel: video.channel || null,
// // // //   createdAt: video.createdAt || null,
// // // //   duration: video.duration ?? video.durationSeconds,
// // // //   uploadDate: video.uploadDate || video.createdAt || null,
// // // //   watchedPercent: Number(video.watchedPercent || 0),
// // // //   isLiked: Boolean(video.isLiked || video.userReaction === "like"),
// // // //   isDisliked: Boolean(video.isDisliked || video.userReaction === "dislike"),
// // // //   raw: video,
// // // // });

// // // // const normalizeShort = (video: any = {}) => ({
// // // //   ...normalizeVideo(video),
// // // //   isShort: true,
// // // //   videoType: "short",
// // // // });

// // // // const normalizeChannel = (channel: any = {}) => ({
// // // //   id: channel._id || channel.id || channel.channelId,
// // // //   title: channel.name || channel.channelName || "Subscribed Channel",
// // // //   thumb: channel.channelImage || channel.avatar || channel.image || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // // //   isChannel: true,
// // // //   videoType: "channel",
// // // //   raw: channel,
// // // // });

// // // // const getArray = (payload: any) => {
// // // //   if (Array.isArray(payload)) return payload;
// // // //   if (Array.isArray(payload?.videos)) return payload.videos;
// // // //   if (Array.isArray(payload?.data)) return payload.data;
// // // //   if (Array.isArray(payload?.channels)) return payload.channels;
// // // //   if (Array.isArray(payload?.subscribedChannels)) return payload.subscribedChannels;
// // // //   return [];
// // // // };

// // // // const fetchWithAuth = async (endpoint: string, params: any = {}) => {
// // // //   const token = await AsyncStorage.getItem("token");
// // // //   const headers = token ? { Authorization: `Bearer ${token}` } : {};
// // // //   const query = new URLSearchParams(
// // // //     Object.entries(params)
// // // //       .filter(([, v]) => v !== undefined)
// // // //       .map(([k, v]) => [k, String(v)])
// // // //   ).toString();

// // // //   const res = await fetch(`${API_BASE}/${endpoint}${query ? `?${query}` : ""}`, { headers });
// // // //   if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
// // // //   const data = await res.json();
// // // //   if (data?.success === false) throw new Error(data.message || "Failed");
// // // //   return data;
// // // // };

// // // // const formatViews = (v: number = 0) => {
// // // //   if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
// // // //   if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
// // // //   return `${v.toLocaleString()} views`;
// // // // };

// // // // const formatDuration = (value: any) => {
// // // //   if (typeof value === "string" && value.includes(":")) return value;
// // // //   const sec = Number(value);
// // // //   if (!Number.isFinite(sec) || sec <= 0) return "";
// // // //   const total = Math.floor(sec);
// // // //   const h = Math.floor(total / 3600);
// // // //   const m = Math.floor((total % 3600) / 60);
// // // //   const s = total % 60;
// // // //   return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
// // // // };

// // // // // ====================== Components ======================
// // // // function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
// // // //   return (
// // // //     <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.sectionHeader}>
// // // //       <Text style={styles.sectionTitle}>{title}</Text>
// // // //       <ChevronRight size={20} color="#a1a1aa" />
// // // //     </TouchableOpacity>
// // // //   );
// // // // }

// // // // function MovieCard({ item, onPress, onAddToWatchLater, onRemoveFromWatchLater }: any) {
// // // //   const [adding, setAdding] = useState(false);
// // // //   const [saved, setSaved] = useState(false);

// // // //   const handleWatchLater = async () => {
// // // //     if (adding) return;
// // // //     setAdding(true);
// // // //     const prev = saved;
// // // //     setSaved(!prev);
// // // //     try {
// // // //       const result = prev ? await onRemoveFromWatchLater?.(item) : await onAddToWatchLater?.(item);
// // // //       if (!result?.success) setSaved(prev);
// // // //     } catch {
// // // //       setSaved(prev);
// // // //     } finally {
// // // //       setAdding(false);
// // // //     }
// // // //   };

// // // //   const durationText = formatDuration(item.duration);
// // // //   const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));

// // // //   return (
// // // //     <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(item)} style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
// // // //       <View style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
// // // //         <Image source={{ uri: item.thumb || item.thumbnail }} style={styles.cardImage} resizeMode="cover" />
// // // //         {durationText ? (
// // // //           <View style={styles.durationBadge}>
// // // //             <Text style={styles.durationText}>{durationText}</Text>
// // // //           </View>
// // // //         ) : null}
// // // //         <View style={styles.cardOverlay}>
// // // //           <View style={styles.cardActions}>
// // // //             <TouchableOpacity style={styles.actionBtnWhite} onPress={() => onPress(item)}>
// // // //               <Play size={14} color="#000" fill="#000" />
// // // //             </TouchableOpacity>
// // // //             {(onAddToWatchLater || onRemoveFromWatchLater) && (
// // // //               <TouchableOpacity style={[styles.actionBtnBorder, adding && { opacity: 0.5 }]} onPress={handleWatchLater} disabled={adding}>
// // // //                 {saved ? <Check size={14} color="#fff" /> : <Plus size={14} color="#fff" />}
// // // //               </TouchableOpacity>
// // // //             )}
// // // //           </View>
// // // //         </View>
// // // //         {progress > 0 && (
// // // //           <View style={styles.progressBarContainer}>
// // // //             <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
// // // //           </View>
// // // //         )}
// // // //       </View>
// // // //       <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
// // // //       <Text style={styles.viewsText}>{formatViews(item.views)}</Text>
// // // //     </TouchableOpacity>
// // // //   );
// // // // }

// // // // // ====================== Main ======================
// // // // export default function NetflixStylePage() {
// // // //   const navigation = useNavigation<any>();
// // // //   const isFocused = useIsFocused();

// // // //   // Primary sections (Limit 5)
// // // //   const [recommended, setRecommended] = useState<any[]>([]);
// // // //   const [trending, setTrending] = useState<any[]>([]);
// // // //   const [latest, setLatest] = useState<any[]>([]);
// // // //   const [trendingShorts, setTrendingShorts] = useState<any[]>([]);
// // // //   const [subscriptions, setSubscriptions] = useState<any[]>([]);
// // // //   const [topShorts, setTopShorts] = useState<any[]>([]);

// // // //   // Continuous feed (YouTube style)
// // // //   const [feed, setFeed] = useState<any[]>([]);
// // // //   const [loading, setLoading] = useState(true);
// // // //   const [refreshing, setRefreshing] = useState(false);
// // // //   const [loadingMore, setLoadingMore] = useState(false);
// // // //   const [hasMore, setHasMore] = useState(true);
// // // //   const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
// // // //   const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

// // // //   const seenIds = useRef(new Set<string>());
// // // //   const pageRef = useRef({ recommended: 2, trending: 2, latest: 2 });
// // // //   const loadingMoreRef = useRef(false);

// // // //   const isShort = (item: any) => {
// // // //     const t = item?.videoType ?? item?.raw?.videoType ?? [];
// // // //     const types = (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
// // // //     return item?.isShort || types.some((x) => x.includes("short"));
// // // //   };

// // // //   // ====================== Load Primary (Limit 5 sections) ======================
// // // //   const loadPrimary = useCallback(async () => {
// // // //     try {
// // // //       setLoading(true);
// // // //       seenIds.current.clear();
// // // //       pageRef.current = { recommended: 2, trending: 2, latest: 2 };

// // // //       const [recData, trenData, latData, shortData, subData, topShortData] = await Promise.all([
// // // //         fetchWithAuth("recommended", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
// // // //         fetchWithAuth("trending", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
// // // //         fetchWithAuth("latest", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
// // // //         fetchWithAuth("trending-shorts", { page: 1, limit: LIMIT }),
// // // //         fetchWithAuth("subscribed-channels"),
// // // //         fetchWithAuth("trending-shorts", { page: 2, limit: LIMIT }),
// // // //       ]);

// // // //       const mark = (list: any[]) => list.forEach((i) => i?.id && seenIds.current.add(String(i.id)));

// // // //       const rec = getArray(recData).map(normalizeVideo);
// // // //       const tren = getArray(trenData).map(normalizeVideo);
// // // //       const lat = getArray(latData).map(normalizeVideo);
// // // //       const shorts = getArray(shortData).map(normalizeShort);
// // // //       const subs = getArray(subData).map(normalizeChannel).slice(0, LIMIT);
// // // //       const topS = getArray(topShortData).map(normalizeShort);

// // // //       mark(rec); mark(tren); mark(lat); mark(shorts); mark(topS);

// // // //       setRecommended(rec);
// // // //       setTrending(tren);
// // // //       setLatest(lat);
// // // //       setTrendingShorts(shorts);
// // // //       setSubscriptions(subs);
// // // //       setTopShorts(topS);

// // // //       // Start continuous feed with remaining recommended
// // // //       setFeed([]);
// // // //       setHasMore(true);
// // // //     } catch (e) {
// // // //       console.warn(e);
// // // //       Toast.show({ type: "error", text1: "Failed to load feed" });
// // // //     } finally {
// // // //       setLoading(false);
// // // //     }
// // // //   }, [selectedCategoryId]);

// // // //   // ====================== Load More (YouTube continuous) ======================
// // // //   const loadMore = useCallback(async () => {
// // // //     if (loadingMoreRef.current || !hasMore) return;
// // // //     loadingMoreRef.current = true;
// // // //     setLoadingMore(true);

// // // //     try {
// // // //       const newItems: any[] = [];
// // // //       let attempts = 0;

// // // //       // Round-robin load from recommended → trending → latest
// // // //       while (newItems.length < LIMIT && attempts < MAX_PAGES) {
// // // //         attempts++;

// // // //         // 1. Recommended
// // // //         if (newItems.length < LIMIT) {
// // // //           const payload = await fetchWithAuth("recommended", {
// // // //             page: pageRef.current.recommended,
// // // //             limit: LIMIT,
// // // //             category: selectedCategoryId || undefined,
// // // //           });
// // // //           const items = getArray(payload).map(normalizeVideo);
// // // //           pageRef.current.recommended++;
// // // //           for (const item of items) {
// // // //             const id = String(item.id);
// // // //             if (!id || seenIds.current.has(id)) continue;
// // // //             seenIds.current.add(id);
// // // //             newItems.push({ ...item, feedType: "recommended" });
// // // //             if (newItems.length >= LIMIT) break;
// // // //           }
// // // //           if (!hasMorePages(payload, pageRef.current.recommended - 1, LIMIT, items.length) && newItems.length === 0) {
// // // //             // continue to next type
// // // //           }
// // // //         }

// // // //         // 2. Trending
// // // //         if (newItems.length < LIMIT) {
// // // //           const payload = await fetchWithAuth("trending", {
// // // //             page: pageRef.current.trending,
// // // //             limit: LIMIT,
// // // //             category: selectedCategoryId || undefined,
// // // //           });
// // // //           const items = getArray(payload).map(normalizeVideo);
// // // //           pageRef.current.trending++;
// // // //           for (const item of items) {
// // // //             const id = String(item.id);
// // // //             if (!id || seenIds.current.has(id)) continue;
// // // //             seenIds.current.add(id);
// // // //             newItems.push({ ...item, feedType: "trending" });
// // // //             if (newItems.length >= LIMIT) break;
// // // //           }
// // // //         }

// // // //         // 3. Latest
// // // //         if (newItems.length < LIMIT) {
// // // //           const payload = await fetchWithAuth("latest", {
// // // //             page: pageRef.current.latest,
// // // //             limit: LIMIT,
// // // //             category: selectedCategoryId || undefined,
// // // //           });
// // // //           const items = getArray(payload).map(normalizeVideo);
// // // //           pageRef.current.latest++;
// // // //           for (const item of items) {
// // // //             const id = String(item.id);
// // // //             if (!id || seenIds.current.has(id)) continue;
// // // //             seenIds.current.add(id);
// // // //             newItems.push({ ...item, feedType: "latest" });
// // // //             if (newItems.length >= LIMIT) break;
// // // //           }
// // // //           if (!hasMorePages(payload, pageRef.current.latest - 1, LIMIT, items.length) && newItems.length === 0) {
// // // //             setHasMore(false);
// // // //             break;
// // // //           }
// // // //         }
// // // //       }

// // // //       if (newItems.length > 0) {
// // // //         setFeed((prev) => [...prev, ...newItems]);
// // // //       } else {
// // // //         setHasMore(false);
// // // //       }
// // // //     } catch (e) {
// // // //       console.warn("Load more error:", e);
// // // //     } finally {
// // // //       loadingMoreRef.current = false;
// // // //       setLoadingMore(false);
// // // //     }
// // // //   }, [hasMore, selectedCategoryId]);

// // // //   useEffect(() => {
// // // //     loadPrimary();
// // // //   }, [loadPrimary]);

// // // //   // Auto start continuous feed after primary load
// // // //   useEffect(() => {
// // // //     if (!loading && recommended.length > 0 && feed.length === 0) {
// // // //       loadMore();
// // // //     }
// // // //   }, [loading]);

// // // //   // View count socket
// // // //   useEffect(() => {
// // // //     let active = true;
// // // //     let socket: any;
// // // //     let handler: any;

// // // //     getViewSocket().then((s) => {
// // // //       if (!active || !s) return;
// // // //       socket = s;
// // // //       handler = ({ videoId, views }: any) => {
// // // //         const upd = (list: any[]) => list.map((i) => (String(i.id) === String(videoId) ? { ...i, views } : i));
// // // //         setRecommended(upd);
// // // //         setTrending(upd);
// // // //         setLatest(upd);
// // // //         setFeed(upd);
// // // //         setTrendingShorts((p) => upd(p));
// // // //         setTopShorts((p) => upd(p));
// // // //       };
// // // //       socket.on("view-count-updated", handler);
// // // //     });

// // // //     return () => {
// // // //       active = false;
// // // //       if (socket && handler) socket.off("view-count-updated", handler);
// // // //     };
// // // //   }, []);

// // // //   const onRefresh = async () => {
// // // //     setRefreshing(true);
// // // //     setActiveVideoId(null);
// // // //     await loadPrimary();
// // // //     setRefreshing(false);
// // // //   };

// // // //   const handleItemClick = (item: any) => {
// // // //     setActiveVideoId(null);
// // // //     if (item?.isChannel) {
// // // //       navigation.navigate("SubscribedChannels", { id: item.id });
// // // //       return;
// // // //     }
// // // //     if (isShort(item)) {
// // // //       navigation.navigate("MainTabs", { screen: "Shorts", params: { video: item } });
// // // //       return;
// // // //     }
// // // //     navigation.navigate("VideoDetail", { id: item.id, item, video: item });
// // // //   };

// // // //   const handleSectionPress = (type: string) => navigation.navigate("ViewAll", { type });

// // // //   const handleAddToWatchLater = async (item: any) => {
// // // //     try {
// // // //       const token = await AsyncStorage.getItem("token");
// // // //       if (!token) {
// // // //         Toast.show({ type: "error", text1: "Please login first" });
// // // //         return { success: false };
// // // //       }
// // // //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// // // //         method: "POST",
// // // //         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
// // // //       });
// // // //       const data = await res.json().catch(() => ({}));
// // // //       if (data.success) {
// // // //         Toast.show({ type: "success", text1: data.message || "Added to Watch Later" });
// // // //         return { success: true };
// // // //       }
// // // //       Toast.show({ type: "error", text1: data.message || "Failed" });
// // // //       return { success: false };
// // // //     } catch {
// // // //       Toast.show({ type: "error", text1: "Something went wrong" });
// // // //       return { success: false };
// // // //     }
// // // //   };

// // // //   const handleRemoveFromWatchLater = async (item: any) => {
// // // //     try {
// // // //       const token = await AsyncStorage.getItem("token");
// // // //       if (!token) return { success: false };
// // // //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// // // //         method: "DELETE",
// // // //         headers: { Authorization: `Bearer ${token}` },
// // // //       });
// // // //       const data = await res.json().catch(() => ({}));
// // // //       if (res.ok && data?.success !== false) {
// // // //         Toast.show({ type: "success", text1: "Removed from Watch Later" });
// // // //         return { success: true };
// // // //       }
// // // //       return { success: false };
// // // //     } catch {
// // // //       return { success: false };
// // // //     }
// // // //   };

// // // //   // Viewability for autoplay
// // // //   const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60, minimumViewTime: 250 }).current;
// // // //   const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
// // // //     if (viewableItems?.length > 0) {
// // // //       const most = viewableItems.reduce((a: any, b: any) =>
// // // //         (b?.percentVisible ?? 0) > (a?.percentVisible ?? 0) ? b : a
// // // //       );
// // // //       const item = most?.item;
// // // //       if (item?.id && !isShort(item) && item.videoUrl) {
// // // //         setActiveVideoId(item.id);
// // // //       } else {
// // // //         setActiveVideoId(null);
// // // //       }
// // // //     } else {
// // // //       setActiveVideoId(null);
// // // //     }
// // // //   }).current;

// // // //   // ====================== Render ======================
// // // //   const renderHorizontal = (title: string, data: any[], type: string, empty = "No videos") => (
// // // //     <View style={styles.section}>
// // // //       <SectionHeader title={title} onPress={() => handleSectionPress(type)} />
// // // //       {loading && data.length === 0 ? (
// // // //         <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
// // // //       ) : data.length > 0 ? (
// // // //         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
// // // //           {data.map((item) => (
// // // //             <MovieCard
// // // //               key={item.id}
// // // //               item={item}
// // // //               onPress={handleItemClick}
// // // //               onAddToWatchLater={handleAddToWatchLater}
// // // //               onRemoveFromWatchLater={handleRemoveFromWatchLater}
// // // //             />
// // // //           ))}
// // // //         </ScrollView>
// // // //       ) : (
// // // //         <Text style={styles.emptyText}>{empty}</Text>
// // // //       )}
// // // //     </View>
// // // //   );

// // // //   const renderShortsGrid = (title: string, data: any[]) => (
// // // //     <View style={[styles.section, { marginBottom: 32 }]}>
// // // //       <SectionHeader title={title} onPress={() => handleSectionPress("shorts")} />
// // // //       {loading && data.length === 0 ? (
// // // //         <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
// // // //       ) : data.length > 0 ? (
// // // //         <View style={styles.shortsGrid}>
// // // //           {data.map((item) => (
// // // //             <TouchableOpacity key={item.id} style={styles.shortCard} onPress={() => handleItemClick(item)} activeOpacity={0.9}>
// // // //               <View style={styles.shortImageWrapper}>
// // // //                 <Image source={{ uri: item.thumbnail || item.thumb }} style={styles.shortImage} resizeMode="cover" />
// // // //                 <View style={styles.shortOverlay}>
// // // //                   <Text style={styles.shortTitle} numberOfLines={2}>{item.title}</Text>
// // // //                   <Text style={styles.shortViews}>{Number(item.views || 0).toLocaleString()} views</Text>
// // // //                 </View>
// // // //               </View>
// // // //             </TouchableOpacity>
// // // //           ))}
// // // //         </View>
// // // //       ) : (
// // // //         <Text style={styles.emptyText}>No shorts available</Text>
// // // //       )}
// // // //     </View>
// // // //   );

// // // //   const renderFeedItem = ({ item }: { item: any }) => {
// // // //     const isActive = isFocused && activeVideoId === item.id && !!item.videoUrl;
// // // //     const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));

// // // //     return (
// // // //       <TouchableOpacity activeOpacity={0.9} onPress={() => handleItemClick(item)} style={styles.verticalCard}>
// // // //         <View style={styles.verticalThumbWrapper}>
// // // //           {isActive ? (
// // // //             <AutoplayPreview uri={item.videoUrl} style={styles.verticalThumb} />
// // // //           ) : (
// // // //             <Image source={{ uri: item.thumb || item.thumbnail }} style={styles.verticalThumb} resizeMode="cover" />
// // // //           )}
// // // //           {progress > 0 && (
// // // //             <View style={styles.progressBarContainer}>
// // // //               <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
// // // //             </View>
// // // //           )}
// // // //           {isActive && (
// // // //             <View style={styles.mutedBadge}>
// // // //               <Text style={styles.mutedText}>🔇</Text>
// // // //             </View>
// // // //           )}
// // // //         </View>
// // // //         <View style={styles.verticalInfo}>
// // // //           <Text style={styles.verticalTitle} numberOfLines={2}>{item.title}</Text>
// // // //           <Text style={styles.verticalMeta}>
// // // //             {formatViews(item.views)}
// // // //             {item.channel?.name ? ` • ${item.channel.name}` : ""}
// // // //           </Text>
// // // //         </View>
// // // //       </TouchableOpacity>
// // // //     );
// // // //   };

// // // //   return (
// // // //     <View style={styles.container}>
// // // //       <StatusBar barStyle="light-content" backgroundColor="#000" />
// // // //       <Navbar onMenuPress={() => {}} points={0} />

// // // //       <TopicChips
// // // //         onTopicChange={(_, categoryId) => setSelectedCategoryId(categoryId || null)}
// // // //       />

// // // //       <FlatList
// // // //         data={feed}
// // // //         keyExtractor={(item, index) => `${item.id}-${index}`}
// // // //         renderItem={renderFeedItem}
// // // //         showsVerticalScrollIndicator={false}
// // // //         contentContainerStyle={styles.scrollContent}
// // // //         onEndReached={() => {
// // // //           if (hasMore && !loadingMore) loadMore();
// // // //         }}
// // // //         onEndReachedThreshold={0.5}
// // // //         onViewableItemsChanged={onViewableItemsChanged}
// // // //         viewabilityConfig={viewabilityConfig}
// // // //         ListHeaderComponent={
// // // //           <>
// // // //             {/* 1. Recommended for you (Limit 5) */}
// // // //             {renderHorizontal("Recommended for you", recommended, "recommended")}

// // // //             {/* 2. Trending Videos (Limit 5) */}
// // // //             {renderHorizontal("Trending Videos", trending, "trending")}

// // // //             {/* 3. Latest Videos (Limit 5) */}
// // // //             {renderHorizontal("Latest Videos", latest, "latest")}

// // // //             {/* 4. Trending Shorts (Limit 5) */}
// // // //             {renderShortsGrid("Trending Shorts", trendingShorts)}

// // // //             {/* 5. From your Subscriptions (Limit 5) */}
// // // //             {renderHorizontal("From your Subscriptions", subscriptions, "subscriptions", "Subscribe to channels to see their videos here.")}

// // // //             {/* 6. Top Shorts (Limit 5) */}
// // // //             {renderShortsGrid("Top Shorts", topShorts)}

// // // //             {/* Continuous Feed Header */}
// // // //             {feed.length > 0 && (
// // // //               <View style={styles.section}>
// // // //                 <Text style={styles.sectionTitle}>More Videos For You</Text>
// // // //               </View>
// // // //             )}
// // // //           </>
// // // //         }
// // // //         ListFooterComponent={
// // // //           loadingMore ? (
// // // //             <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
// // // //           ) : !hasMore && feed.length > 0 ? (
// // // //             <Text style={[styles.emptyText, { textAlign: "center", marginVertical: 20 }]}>
// // // //               No more videos
// // // //             </Text>
// // // //           ) : null
// // // //         }
// // // //         refreshControl={
// // // //           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={["#fff"]} />
// // // //         }
// // // //       />
// // // //     </View>
// // // //   );
// // // // }

// // // // // ====================== Styles ======================
// // // // const styles = StyleSheet.create({
// // // //   container: { flex: 1, backgroundColor: "#000" },
// // // //   scrollContent: { paddingTop: 12, paddingBottom: 80, paddingHorizontal: 16 },
// // // //   section: { marginBottom: 28 },
// // // //   sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 6 },
// // // //   sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
// // // //   horizontalList: { paddingRight: 12, gap: CARD_GAP },
// // // //   cardWrapper: { marginRight: 4 },
// // // //   card: { borderRadius: 10, overflow: "hidden", backgroundColor: "#18181b" },
// // // //   cardImage: { width: "100%", height: "100%" },
// // // //   cardOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end", padding: 8 },
// // // //   durationBadge: { position: "absolute", right: 7, bottom: 7, zIndex: 2, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: "rgba(0,0,0,0.8)" },
// // // //   durationText: { color: "#fff", fontSize: 10, fontWeight: "600" },
// // // //   cardActions: { flexDirection: "row", gap: 8 },
// // // //   actionBtnWhite: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
// // // //   actionBtnBorder: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center" },
// // // //   progressBarContainer: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, backgroundColor: "rgba(0,0,0,0.5)" },
// // // //   progressBarFill: { height: "100%", backgroundColor: "#dc2626" },
// // // //   cardTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginTop: 8, lineHeight: 18 },
// // // //   viewsText: { color: "#a1a1aa", fontSize: 12, marginTop: 3 },
// // // //   emptyText: { color: "#a1a1aa", fontSize: 14, marginTop: 8 },
// // // //   shortsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 },
// // // //   shortCard: { width: SHORT_WIDTH },
// // // //   shortImageWrapper: { width: SHORT_WIDTH, height: SHORT_HEIGHT, borderRadius: 12, overflow: "hidden", backgroundColor: "#18181b" },
// // // //   shortImage: { width: "100%", height: "100%" },
// // // //   shortOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10, backgroundColor: "rgba(0,0,0,0.55)" },
// // // //   shortTitle: { color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 17 },
// // // //   shortViews: { color: "#ccc", fontSize: 11, marginTop: 4 },
// // // //   verticalCard: { marginBottom: 20 },
// // // //   verticalThumbWrapper: { width: "100%", aspectRatio: 16 / 9, borderRadius: 12, overflow: "hidden", backgroundColor: "#18181b" },
// // // //   verticalThumb: { width: "100%", height: "100%" },
// // // //   verticalInfo: { marginTop: 10, paddingHorizontal: 2 },
// // // //   verticalTitle: { color: "#fff", fontSize: 15, fontWeight: "600", lineHeight: 20 },
// // // //   verticalMeta: { color: "#a1a1aa", fontSize: 13, marginTop: 4 },
// // // //   mutedBadge: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
// // // //   mutedText: { color: "#fff", fontSize: 13 },
// // // // });

// // // import React, { useState, useEffect, useCallback, useRef } from "react";
// // // import {
// // //   View,
// // //   Text,
// // //   Image,
// // //   ScrollView,
// // //   TouchableOpacity,
// // //   StyleSheet,
// // //   Dimensions,
// // //   ActivityIndicator,
// // //   StatusBar,
// // //   RefreshControl,
// // //   FlatList,
// // // } from "react-native";
// // // import { useIsFocused, useNavigation } from "@react-navigation/native";
// // // import { VideoView, useVideoPlayer } from "expo-video";
// // // import {
// // //   BadgeCheck,
// // //   ChevronRight,
// // //   Play,
// // //   Plus,
// // //   Check,
// // // } from "lucide-react-native";
// // // import Toast from "react-native-toast-message";
// // // import AsyncStorage from "@react-native-async-storage/async-storage";
// // // import Navbar from "./Navbar";
// // // import TopicChips from "./TopicChips";
// // // import { getViewSocket } from "../utils/viewSocket";
// // // import { API_ORIGIN } from "../../config/api";

// // // const { width: SCREEN_WIDTH } = Dimensions.get("window");

// // // const CARD_WIDTH = SCREEN_WIDTH * 0.42;
// // // const CARD_HEIGHT = CARD_WIDTH * (9 / 16);
// // // const SHORT_WIDTH = (SCREEN_WIDTH - 44) / 2;
// // // const SHORT_HEIGHT = SHORT_WIDTH * (16 / 9);
// // // const CARD_GAP = 14;

// // // const BACKEND_URL = API_ORIGIN;
// // // const API_BASE = `${BACKEND_URL}/api/uservideo`;
// // // const LIMIT = 5;
// // // const MAX_PAGES = 30;

// // // const hasMorePages = (payload: any, page: number, limit: number, count: number) => {
// // //   if (typeof payload?.hasMore === "boolean") return payload.hasMore;
// // //   const total = Number(payload?.total ?? payload?.pagination?.total);
// // //   if (Number.isFinite(total)) return total > page * limit;
// // //   return count >= limit;
// // // };

// // // function AutoplayPreview({ uri, style }: { uri: string; style: any }) {
// // //   const player = useVideoPlayer(uri, (p) => {
// // //     p.loop = true;
// // //     p.muted = true;
// // //     p.play();
// // //   });
// // //   return (
// // //     <VideoView
// // //       player={player}
// // //       style={style}
// // //       contentFit="cover"
// // //       nativeControls={false}
// // //       allowsPictureInPicture={false}
// // //     />
// // //   );
// // // }

// // // const toMediaUrl = (value: any, fallback: string) => {
// // //   if (!value) return fallback;
// // //   const path = String(value).replace(/\\/g, "/");
// // //   if (/^https?:\/\//i.test(path)) return path;
// // //   return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
// // // };

// // // const normalizeVideo = (video: any = {}) => ({
// // //   id: video._id || video.id,
// // //   title: video.title || "Untitled video",
// // //   thumb: toMediaUrl(
// // //     video.thumbnail,
// // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"
// // //   ),
// // //   thumbnail: toMediaUrl(
// // //     video.thumbnail,
// // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"
// // //   ),
// // //   views: Number(video.views ?? video.viewCount ?? 0),
// // //   likesCount: Number(video.likesCount ?? video.likes ?? 0),
// // //   videoUrl: toMediaUrl(video.videoUrl, ""),
// // //   videoType: video.videoType || null,
// // //   channel: video.channel || null,
// // //   createdAt: video.createdAt || null,
// // //   duration: video.duration ?? video.durationSeconds,
// // //   uploadDate: video.uploadDate || video.createdAt || null,
// // //   watchedPercent: Number(video.watchedPercent || 0),
// // //   isLiked: Boolean(video.isLiked || video.userReaction === "like"),
// // //   isDisliked: Boolean(video.isDisliked || video.userReaction === "dislike"),
// // //   raw: video,
// // // });

// // // const normalizeShort = (video: any = {}) => ({
// // //   ...normalizeVideo(video),
// // //   isShort: true,
// // //   videoType: "short",
// // // });

// // // const normalizeChannel = (channel: any = {}) => ({
// // //   id: channel._id || channel.id || channel.channelId,
// // //   title: channel.name || channel.channelName || "Subscribed Channel",
// // //   thumb:
// // //     channel.channelImage ||
// // //     channel.avatar ||
// // //     channel.image ||
// // //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// // //   isChannel: true,
// // //   videoType: "channel",
// // //   raw: channel,
// // // });

// // // const getArray = (payload: any) => {
// // //   if (Array.isArray(payload)) return payload;
// // //   if (Array.isArray(payload?.videos)) return payload.videos;
// // //   if (Array.isArray(payload?.data)) return payload.data;
// // //   if (Array.isArray(payload?.channels)) return payload.channels;
// // //   if (Array.isArray(payload?.subscribedChannels)) return payload.subscribedChannels;
// // //   return [];
// // // };

// // // const fetchWithAuth = async (endpoint: string, params: any = {}) => {
// // //   const token = await AsyncStorage.getItem("token");
// // //   const headers = token ? { Authorization: `Bearer ${token}` } : {};
// // //   const query = new URLSearchParams(
// // //     Object.entries(params)
// // //       .filter(([, v]) => v !== undefined)
// // //       .map(([k, v]) => [k, String(v)])
// // //   ).toString();

// // //   const res = await fetch(`${API_BASE}/${endpoint}${query ? `?${query}` : ""}`, {
// // //     headers,
// // //   });
// // //   if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
// // //   const data = await res.json();
// // //   if (data?.success === false) throw new Error(data.message || "Failed");
// // //   return data;
// // // };

// // // const formatViews = (v: number = 0) => {
// // //   if (v >= 1_000_000)
// // //     return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
// // //   if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
// // //   return `${v.toLocaleString()} views`;
// // // };

// // // const formatDuration = (value: any) => {
// // //   if (typeof value === "string" && value.includes(":")) return value;
// // //   const sec = Number(value);
// // //   if (!Number.isFinite(sec) || sec <= 0) return "";
// // //   const total = Math.floor(sec);
// // //   const h = Math.floor(total / 3600);
// // //   const m = Math.floor((total % 3600) / 60);
// // //   const s = total % 60;
// // //   return h > 0
// // //     ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
// // //     : `${m}:${String(s).padStart(2, "0")}`;
// // // };

// // // const formatUploadTime = (value: any) => {
// // //   if (!value) return "";
// // //   const date = value instanceof Date ? value : new Date(value);
// // //   if (Number.isNaN(date.getTime())) return "";
// // //   const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
// // //   if (minutes < 1) return "Just now";
// // //   if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
// // //   const hours = Math.floor(minutes / 60);
// // //   if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
// // //   const days = Math.floor(hours / 24);
// // //   if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
// // //   const weeks = Math.floor(days / 7);
// // //   if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
// // //   const months = Math.floor(days / 30);
// // //   if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
// // //   const years = Math.floor(days / 365);
// // //   return `${years} year${years === 1 ? "" : "s"} ago`;
// // // };

// // // // ====================== Components ======================
// // // function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
// // //   return (
// // //     <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.sectionHeader}>
// // //       <Text style={styles.sectionTitle}>{title}</Text>
// // //       <ChevronRight size={20} color="#a1a1aa" />
// // //     </TouchableOpacity>
// // //   );
// // // }

// // // function MovieCard({
// // //   item,
// // //   onPress,
// // //   onAddToWatchLater,
// // //   onRemoveFromWatchLater,
// // // }: any) {
// // //   const [adding, setAdding] = useState(false);
// // //   const [saved, setSaved] = useState(false);
// // //   const [avatarFailed, setAvatarFailed] = useState(false);

// // //   const handleWatchLater = async () => {
// // //     if (adding) return;
// // //     setAdding(true);
// // //     const prev = saved;
// // //     setSaved(!prev);
// // //     try {
// // //       const result = prev
// // //         ? await onRemoveFromWatchLater?.(item)
// // //         : await onAddToWatchLater?.(item);
// // //       if (!result?.success) setSaved(prev);
// // //     } catch {
// // //       setSaved(prev);
// // //     } finally {
// // //       setAdding(false);
// // //     }
// // //   };

// // //   const durationText = formatDuration(item.duration);
// // //   const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));

// // //   const channel = item.channel || {};
// // //   const channelName =
// // //     channel?.name || channel?.channelName || item.channelName || "Unknown Channel";
// // //   const avatarUrl =
// // //     channel?.avatar ||
// // //     channel?.profileImage ||
// // //     channel?.channelImage ||
// // //     channel?.image ||
// // //     "";
// // //   const isVerified = Boolean(channel?.isVerified || channel?.verified);

// // //   return (
// // //     <TouchableOpacity
// // //       activeOpacity={0.9}
// // //       onPress={() => onPress(item)}
// // //       style={styles.ytCard}
// // //     >
// // //       {/* Thumbnail */}
// // //       <View style={styles.ytThumbWrapper}>
// // //         <Image
// // //           source={{ uri: item.thumb || item.thumbnail }}
// // //           style={styles.ytThumb}
// // //           resizeMode="cover"
// // //         />

// // //         {durationText ? (
// // //           <View style={styles.ytDuration}>
// // //             <Text style={styles.ytDurationText}>{durationText}</Text>
// // //           </View>
// // //         ) : null}

// // //         {progress > 0 && (
// // //           <View style={styles.ytProgressTrack}>
// // //             <View style={[styles.ytProgressFill, { width: `${progress}%` }]} />
// // //           </View>
// // //         )}

// // //         <View style={styles.ytActions}>
// // //           <TouchableOpacity style={styles.ytActionBtn} onPress={() => onPress(item)}>
// // //             <Play size={16} color="#000" fill="#000" />
// // //           </TouchableOpacity>

// // //           {(onAddToWatchLater || onRemoveFromWatchLater) && (
// // //             <TouchableOpacity
// // //               style={[styles.ytActionBtnBorder, adding && { opacity: 0.5 }]}
// // //               onPress={handleWatchLater}
// // //               disabled={adding}
// // //             >
// // //               {saved ? <Check size={16} color="#fff" /> : <Plus size={16} color="#fff" />}
// // //             </TouchableOpacity>
// // //           )}
// // //         </View>
// // //       </View>

// // //       {/* Info */}
// // //       <View style={styles.ytInfoRow}>
// // //         <View style={styles.ytAvatar}>
// // //           {avatarUrl && !avatarFailed ? (
// // //             <Image
// // //               source={{ uri: toMediaUrl(avatarUrl, "") }}
// // //               style={styles.ytAvatarImg}
// // //               onError={() => setAvatarFailed(true)}
// // //             />
// // //           ) : (
// // //             <Text style={styles.ytAvatarText}>
// // //               {channelName.charAt(0).toUpperCase()}
// // //             </Text>
// // //           )}
// // //         </View>

// // //         <View style={styles.ytTextCol}>
// // //           <Text style={styles.ytTitle} numberOfLines={2}>
// // //             {item.title}
// // //           </Text>

// // //           <View style={styles.ytChannelRow}>
// // //             <Text style={styles.ytChannelName} numberOfLines={1}>
// // //               {channelName}
// // //             </Text>
// // //             {isVerified && (
// // //               <BadgeCheck size={14} color="#aaa" style={{ marginLeft: 4 }} />
// // //             )}
// // //           </View>

// // //           <Text style={styles.ytMeta} numberOfLines={1}>
// // //             {formatViews(item.views)}
// // //             {item.uploadDate || item.createdAt
// // //               ? ` • ${formatUploadTime(item.uploadDate || item.createdAt)}`
// // //               : ""}
// // //           </Text>
// // //         </View>
// // //       </View>
// // //     </TouchableOpacity>
// // //   );
// // // }

// // // // ====================== Main Screen ======================
// // // export default function NetflixStylePage() {
// // //   const navigation = useNavigation<any>();
// // //   const isFocused = useIsFocused();

// // //   // Primary sections (Limit 5)
// // //   const [recommended, setRecommended] = useState<any[]>([]);
// // //   const [trending, setTrending] = useState<any[]>([]);
// // //   const [latest, setLatest] = useState<any[]>([]);
// // //   const [trendingShorts, setTrendingShorts] = useState<any[]>([]);
// // //   const [subscriptions, setSubscriptions] = useState<any[]>([]);
// // //   const [topShorts, setTopShorts] = useState<any[]>([]);

// // //   // Continuous feed
// // //   const [feed, setFeed] = useState<any[]>([]);
// // //   const [loading, setLoading] = useState(true);
// // //   const [refreshing, setRefreshing] = useState(false);
// // //   const [loadingMore, setLoadingMore] = useState(false);
// // //   const [hasMore, setHasMore] = useState(true);
// // //   const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
// // //   const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

// // //   const seenIds = useRef(new Set<string>());
// // //   const pageRef = useRef({ recommended: 2, trending: 2, latest: 2 });
// // //   const loadingMoreRef = useRef(false);

// // //   const isShort = (item: any) => {
// // //     const t = item?.videoType ?? item?.raw?.videoType ?? [];
// // //     const types = (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
// // //     return item?.isShort || types.some((x) => x.includes("short"));
// // //   };

// // //   // ====================== Load Primary ======================
// // //   const loadPrimary = useCallback(async () => {
// // //     try {
// // //       setLoading(true);
// // //       seenIds.current.clear();
// // //       pageRef.current = { recommended: 2, trending: 2, latest: 2 };

// // //       const [recData, trenData, latData, shortData, subData, topShortData] =
// // //         await Promise.all([
// // //           fetchWithAuth("recommended", {
// // //             page: 1,
// // //             limit: LIMIT,
// // //             category: selectedCategoryId || undefined,
// // //           }),
// // //           fetchWithAuth("trending", {
// // //             page: 1,
// // //             limit: LIMIT,
// // //             category: selectedCategoryId || undefined,
// // //           }),
// // //           fetchWithAuth("latest", {
// // //             page: 1,
// // //             limit: LIMIT,
// // //             category: selectedCategoryId || undefined,
// // //           }),
// // //           fetchWithAuth("trending-shorts", { page: 1, limit: LIMIT }),
// // //           fetchWithAuth("subscribed-channels"),
// // //           fetchWithAuth("trending-shorts", { page: 2, limit: LIMIT }),
// // //         ]);

// // //       const mark = (list: any[]) =>
// // //         list.forEach((i) => i?.id && seenIds.current.add(String(i.id)));

// // //       const rec = getArray(recData).map(normalizeVideo);
// // //       const tren = getArray(trenData).map(normalizeVideo);
// // //       const lat = getArray(latData).map(normalizeVideo);
// // //       const shorts = getArray(shortData).map(normalizeShort);
// // //       const subs = getArray(subData).map(normalizeChannel).slice(0, LIMIT);
// // //       const topS = getArray(topShortData).map(normalizeShort);

// // //       mark(rec);
// // //       mark(tren);
// // //       mark(lat);
// // //       mark(shorts);
// // //       mark(topS);

// // //       setRecommended(rec);
// // //       setTrending(tren);
// // //       setLatest(lat);
// // //       setTrendingShorts(shorts);
// // //       setSubscriptions(subs);
// // //       setTopShorts(topS);

// // //       setFeed([]);
// // //       setHasMore(true);
// // //     } catch (e) {
// // //       console.warn(e);
// // //       Toast.show({ type: "error", text1: "Failed to load feed" });
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   }, [selectedCategoryId]);

// // //   // ====================== Load More (YouTube continuous) ======================
// // //   const loadMore = useCallback(async () => {
// // //     if (loadingMoreRef.current || !hasMore) return;
// // //     loadingMoreRef.current = true;
// // //     setLoadingMore(true);

// // //     try {
// // //       const newItems: any[] = [];
// // //       let attempts = 0;

// // //       while (newItems.length < LIMIT && attempts < MAX_PAGES) {
// // //         attempts++;

// // //         // Recommended
// // //         if (newItems.length < LIMIT) {
// // //           const payload = await fetchWithAuth("recommended", {
// // //             page: pageRef.current.recommended,
// // //             limit: LIMIT,
// // //             category: selectedCategoryId || undefined,
// // //           });
// // //           const items = getArray(payload).map(normalizeVideo);
// // //           pageRef.current.recommended++;
// // //           for (const item of items) {
// // //             const id = String(item.id);
// // //             if (!id || seenIds.current.has(id)) continue;
// // //             seenIds.current.add(id);
// // //             newItems.push({ ...item, feedType: "recommended" });
// // //             if (newItems.length >= LIMIT) break;
// // //           }
// // //         }

// // //         // Trending
// // //         if (newItems.length < LIMIT) {
// // //           const payload = await fetchWithAuth("trending", {
// // //             page: pageRef.current.trending,
// // //             limit: LIMIT,
// // //             category: selectedCategoryId || undefined,
// // //           });
// // //           const items = getArray(payload).map(normalizeVideo);
// // //           pageRef.current.trending++;
// // //           for (const item of items) {
// // //             const id = String(item.id);
// // //             if (!id || seenIds.current.has(id)) continue;
// // //             seenIds.current.add(id);
// // //             newItems.push({ ...item, feedType: "trending" });
// // //             if (newItems.length >= LIMIT) break;
// // //           }
// // //         }

// // //         // Latest
// // //         if (newItems.length < LIMIT) {
// // //           const payload = await fetchWithAuth("latest", {
// // //             page: pageRef.current.latest,
// // //             limit: LIMIT,
// // //             category: selectedCategoryId || undefined,
// // //           });
// // //           const items = getArray(payload).map(normalizeVideo);
// // //           pageRef.current.latest++;
// // //           for (const item of items) {
// // //             const id = String(item.id);
// // //             if (!id || seenIds.current.has(id)) continue;
// // //             seenIds.current.add(id);
// // //             newItems.push({ ...item, feedType: "latest" });
// // //             if (newItems.length >= LIMIT) break;
// // //           }
// // //           if (
// // //             !hasMorePages(payload, pageRef.current.latest - 1, LIMIT, items.length) &&
// // //             newItems.length === 0
// // //           ) {
// // //             setHasMore(false);
// // //             break;
// // //           }
// // //         }
// // //       }

// // //       if (newItems.length > 0) {
// // //         setFeed((prev) => [...prev, ...newItems]);
// // //       } else {
// // //         setHasMore(false);
// // //       }
// // //     } catch (e) {
// // //       console.warn("Load more error:", e);
// // //     } finally {
// // //       loadingMoreRef.current = false;
// // //       setLoadingMore(false);
// // //     }
// // //   }, [hasMore, selectedCategoryId]);

// // //   useEffect(() => {
// // //     loadPrimary();
// // //   }, [loadPrimary]);

// // //   useEffect(() => {
// // //     if (!loading && recommended.length > 0 && feed.length === 0) {
// // //       loadMore();
// // //     }
// // //   }, [loading]);

// // //   // View count socket
// // //   useEffect(() => {
// // //     let active = true;
// // //     let socket: any;
// // //     let handler: any;

// // //     getViewSocket().then((s) => {
// // //       if (!active || !s) return;
// // //       socket = s;
// // //       handler = ({ videoId, views }: any) => {
// // //         const upd = (list: any[]) =>
// // //           list.map((i) =>
// // //             String(i.id) === String(videoId) ? { ...i, views } : i
// // //           );
// // //         setRecommended(upd);
// // //         setTrending(upd);
// // //         setLatest(upd);
// // //         setFeed(upd);
// // //         setTrendingShorts((p) => upd(p));
// // //         setTopShorts((p) => upd(p));
// // //       };
// // //       socket.on("view-count-updated", handler);
// // //     });

// // //     return () => {
// // //       active = false;
// // //       if (socket && handler) socket.off("view-count-updated", handler);
// // //     };
// // //   }, []);

// // //   const onRefresh = async () => {
// // //     setRefreshing(true);
// // //     setActiveVideoId(null);
// // //     await loadPrimary();
// // //     setRefreshing(false);
// // //   };

// // //   const handleItemClick = (item: any) => {
// // //     setActiveVideoId(null);
// // //     if (item?.isChannel) {
// // //       navigation.navigate("SubscribedChannels", { id: item.id });
// // //       return;
// // //     }
// // //     if (isShort(item)) {
// // //       navigation.navigate("MainTabs", {
// // //         screen: "Shorts",
// // //         params: { video: item },
// // //       });
// // //       return;
// // //     }
// // //     navigation.navigate("VideoDetail", { id: item.id, item, video: item });
// // //   };

// // //   const handleSectionPress = (type: string) => {
// // //     navigation.navigate("ViewAll", { type });
// // //   };

// // //   const handleAddToWatchLater = async (item: any) => {
// // //     try {
// // //       const token = await AsyncStorage.getItem("token");
// // //       if (!token) {
// // //         Toast.show({ type: "error", text1: "Please login first" });
// // //         return { success: false };
// // //       }
// // //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// // //         method: "POST",
// // //         headers: {
// // //           Authorization: `Bearer ${token}`,
// // //           "Content-Type": "application/json",
// // //         },
// // //       });
// // //       const data = await res.json().catch(() => ({}));
// // //       if (data.success) {
// // //         Toast.show({
// // //           type: "success",
// // //           text1: data.message || "Added to Watch Later",
// // //         });
// // //         return { success: true };
// // //       }
// // //       Toast.show({ type: "error", text1: data.message || "Failed" });
// // //       return { success: false };
// // //     } catch {
// // //       Toast.show({ type: "error", text1: "Something went wrong" });
// // //       return { success: false };
// // //     }
// // //   };

// // //   const handleRemoveFromWatchLater = async (item: any) => {
// // //     try {
// // //       const token = await AsyncStorage.getItem("token");
// // //       if (!token) return { success: false };
// // //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// // //         method: "DELETE",
// // //         headers: { Authorization: `Bearer ${token}` },
// // //       });
// // //       const data = await res.json().catch(() => ({}));
// // //       if (res.ok && data?.success !== false) {
// // //         Toast.show({ type: "success", text1: "Removed from Watch Later" });
// // //         return { success: true };
// // //       }
// // //       return { success: false };
// // //     } catch {
// // //       return { success: false };
// // //     }
// // //   };

// // //   // Autoplay viewability
// // //   const viewabilityConfig = useRef({
// // //     itemVisiblePercentThreshold: 60,
// // //     minimumViewTime: 250,
// // //   }).current;

// // //   const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
// // //     if (viewableItems?.length > 0) {
// // //       const most = viewableItems.reduce((a: any, b: any) =>
// // //         (b?.percentVisible ?? 0) > (a?.percentVisible ?? 0) ? b : a
// // //       );
// // //       const item = most?.item;
// // //       if (item?.id && !isShort(item) && item.videoUrl) {
// // //         setActiveVideoId(item.id);
// // //       } else {
// // //         setActiveVideoId(null);
// // //       }
// // //     } else {
// // //       setActiveVideoId(null);
// // //     }
// // //   }).current;

// // //   // ====================== Render Helpers ======================
// // //   const renderHorizontal = (
// // //     title: string,
// // //     data: any[],
// // //     type: string,
// // //     empty = "No videos"
// // //   ) => (
// // //     <View style={styles.section}>
// // //       <SectionHeader title={title} onPress={() => handleSectionPress(type)} />
// // //       {loading && data.length === 0 ? (
// // //         <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
// // //       ) : data.length > 0 ? (
// // //         <ScrollView
// // //           horizontal
// // //           showsHorizontalScrollIndicator={false}
// // //           contentContainerStyle={styles.horizontalList}
// // //         >
// // //           {data.map((item) => (
// // //             <MovieCard
// // //               key={item.id}
// // //               item={item}
// // //               onPress={handleItemClick}
// // //               onAddToWatchLater={handleAddToWatchLater}
// // //               onRemoveFromWatchLater={handleRemoveFromWatchLater}
// // //             />
// // //           ))}
// // //         </ScrollView>
// // //       ) : (
// // //         <Text style={styles.emptyText}>{empty}</Text>
// // //       )}
// // //     </View>
// // //   );

// // //   const renderShortsGrid = (title: string, data: any[]) => (
// // //     <View style={[styles.section, { marginBottom: 32 }]}>
// // //       <SectionHeader title={title} onPress={() => handleSectionPress("shorts")} />
// // //       {loading && data.length === 0 ? (
// // //         <ActivityIndicator color="#fff" style={{ marginVertical: 20 }} />
// // //       ) : data.length > 0 ? (
// // //         <View style={styles.shortsGrid}>
// // //           {data.map((item) => (
// // //             <TouchableOpacity
// // //               key={item.id}
// // //               style={styles.shortCard}
// // //               onPress={() => handleItemClick(item)}
// // //               activeOpacity={0.9}
// // //             >
// // //               <View style={styles.shortImageWrapper}>
// // //                 <Image
// // //                   source={{ uri: item.thumbnail || item.thumb }}
// // //                   style={styles.shortImage}
// // //                   resizeMode="cover"
// // //                 />
// // //                 <View style={styles.shortOverlay}>
// // //                   <Text style={styles.shortTitle} numberOfLines={2}>
// // //                     {item.title}
// // //                   </Text>
// // //                   <Text style={styles.shortViews}>
// // //                     {Number(item.views || 0).toLocaleString()} views
// // //                   </Text>
// // //                 </View>
// // //               </View>
// // //             </TouchableOpacity>
// // //           ))}
// // //         </View>
// // //       ) : (
// // //         <Text style={styles.emptyText}>No shorts available</Text>
// // //       )}
// // //     </View>
// // //   );

// // //   const renderFeedItem = ({ item }: { item: any }) => {
// // //     const isActive = isFocused && activeVideoId === item.id && !!item.videoUrl;
// // //     const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));

// // //     return (
// // //       <TouchableOpacity
// // //         activeOpacity={0.9}
// // //         onPress={() => handleItemClick(item)}
// // //         style={styles.verticalCard}
// // //       >
// // //         <View style={styles.verticalThumbWrapper}>
// // //           {isActive ? (
// // //             <AutoplayPreview uri={item.videoUrl} style={styles.verticalThumb} />
// // //           ) : (
// // //             <Image
// // //               source={{ uri: item.thumb || item.thumbnail }}
// // //               style={styles.verticalThumb}
// // //               resizeMode="cover"
// // //             />
// // //           )}
// // //           {progress > 0 && (
// // //             <View style={styles.progressBarContainer}>
// // //               <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
// // //             </View>
// // //           )}
// // //           {isActive && (
// // //             <View style={styles.mutedBadge}>
// // //               <Text style={styles.mutedText}>🔇</Text>
// // //             </View>
// // //           )}
// // //         </View>
// // //         <View style={styles.verticalInfo}>
// // //           <Text style={styles.verticalTitle} numberOfLines={2}>
// // //             {item.title}
// // //           </Text>
// // //           <Text style={styles.verticalMeta}>
// // //             {formatViews(item.views)}
// // //             {item.channel?.name ? ` • ${item.channel.name}` : ""}
// // //           </Text>
// // //         </View>
// // //       </TouchableOpacity>
// // //     );
// // //   };

// // //   return (
// // //     <View style={styles.container}>
// // //       <StatusBar barStyle="light-content" backgroundColor="#000" />
// // //       <Navbar onMenuPress={() => {}} points={0} />

// // //       <TopicChips
// // //         onTopicChange={(_, categoryId) => setSelectedCategoryId(categoryId || null)}
// // //       />

// // //       <FlatList
// // //         data={feed}
// // //         keyExtractor={(item, index) => `${item.id}-${index}`}
// // //         renderItem={renderFeedItem}
// // //         showsVerticalScrollIndicator={false}
// // //         contentContainerStyle={styles.scrollContent}
// // //         onEndReached={() => {
// // //           if (hasMore && !loadingMore) loadMore();
// // //         }}
// // //         onEndReachedThreshold={0.5}
// // //         onViewableItemsChanged={onViewableItemsChanged}
// // //         viewabilityConfig={viewabilityConfig}
// // //         ListHeaderComponent={
// // //           <>
// // //             {/* 1. Recommended for you (Limit 5) */}
// // //             {renderHorizontal("Recommended for you", recommended, "recommended")}

// // //             {/* 2. Trending Videos (Limit 5) */}
// // //             {renderHorizontal("Trending Videos", trending, "trending")}

// // //             {/* 3. Latest Videos (Limit 5) */}
// // //             {renderHorizontal("Latest Videos", latest, "latest")}

// // //             {/* 4. Trending Shorts (Limit 5) */}
// // //             {renderShortsGrid("Trending Shorts", trendingShorts)}

// // //             {/* 5. From your Subscriptions (Limit 5) */}
// // //             {renderHorizontal(
// // //               "From your Subscriptions",
// // //               subscriptions,
// // //               "subscriptions",
// // //               "Subscribe to channels to see their videos here."
// // //             )}

// // //             {/* 6. Top Shorts (Limit 5) */}
// // //             {renderShortsGrid("Top Shorts", topShorts)}

// // //             {/* Continuous Feed Header */}
// // //             {feed.length > 0 && (
// // //               <View style={styles.section}>
// // //                 <Text style={styles.sectionTitle}>More Videos For You</Text>
// // //               </View>
// // //             )}
// // //           </>
// // //         }
// // //         ListFooterComponent={
// // //           loadingMore ? (
// // //             <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
// // //           ) : !hasMore && feed.length > 0 ? (
// // //             <Text
// // //               style={[styles.emptyText, { textAlign: "center", marginVertical: 20 }]}
// // //             >
// // //               No more videos
// // //             </Text>
// // //           ) : null
// // //         }
// // //         refreshControl={
// // //           <RefreshControl
// // //             refreshing={refreshing}
// // //             onRefresh={onRefresh}
// // //             tintColor="#fff"
// // //             colors={["#fff"]}
// // //           />
// // //         }
// // //       />
// // //     </View>
// // //   );
// // // }

// // // // ====================== Styles ======================
// // // const styles = StyleSheet.create({
// // //   container: {
// // //     flex: 1,
// // //     backgroundColor: "#000",
// // //   },
// // //   scrollContent: {
// // //     paddingTop: 12,
// // //     paddingBottom: 80,
// // //     paddingHorizontal: 16,
// // //   },
// // //   section: {
// // //     marginBottom: 28,
// // //   },
// // //   sectionHeader: {
// // //     flexDirection: "row",
// // //     alignItems: "center",
// // //     marginBottom: 14,
// // //     gap: 6,
// // //   },
// // //   sectionTitle: {
// // //     color: "#fff",
// // //     fontSize: 18,
// // //     fontWeight: "700",
// // //   },
// // //   horizontalList: {
// // //     paddingRight: 12,
// // //     gap: CARD_GAP,
// // //   },
// // //   emptyText: {
// // //     color: "#a1a1aa",
// // //     fontSize: 14,
// // //     marginTop: 8,
// // //   },

// // //   // ===== YouTube Card =====
// // //   ytCard: {
// // //     width: CARD_WIDTH,
// // //     marginRight: 12,
// // //   },
// // //   ytThumbWrapper: {
// // //     width: "100%",
// // //     aspectRatio: 16 / 9,
// // //     borderRadius: 12,
// // //     overflow: "hidden",
// // //     backgroundColor: "#222",
// // //     position: "relative",
// // //   },
// // //   ytThumb: {
// // //     width: "100%",
// // //     height: "100%",
// // //   },
// // //   ytDuration: {
// // //     position: "absolute",
// // //     bottom: 8,
// // //     right: 8,
// // //     backgroundColor: "rgba(0,0,0,0.85)",
// // //     paddingHorizontal: 6,
// // //     paddingVertical: 2,
// // //     borderRadius: 4,
// // //   },
// // //   ytDurationText: {
// // //     color: "#fff",
// // //     fontSize: 12,
// // //     fontWeight: "600",
// // //   },
// // //   ytProgressTrack: {
// // //     position: "absolute",
// // //     bottom: 0,
// // //     left: 0,
// // //     right: 0,
// // //     height: 3,
// // //     backgroundColor: "rgba(255,255,255,0.3)",
// // //   },
// // //   ytProgressFill: {
// // //     height: "100%",
// // //     backgroundColor: "#f00",
// // //   },
// // //   ytActions: {
// // //     position: "absolute",
// // //     bottom: 10,
// // //     left: 10,
// // //     flexDirection: "row",
// // //     gap: 8,
// // //   },
// // //   ytActionBtn: {
// // //     width: 34,
// // //     height: 34,
// // //     borderRadius: 17,
// // //     backgroundColor: "#fff",
// // //     alignItems: "center",
// // //     justifyContent: "center",
// // //   },
// // //   ytActionBtnBorder: {
// // //     width: 34,
// // //     height: 34,
// // //     borderRadius: 17,
// // //     borderWidth: 1.5,
// // //     borderColor: "rgba(255,255,255,0.8)",
// // //     alignItems: "center",
// // //     justifyContent: "center",
// // //     backgroundColor: "rgba(0,0,0,0.4)",
// // //   },
// // //   ytInfoRow: {
// // //     flexDirection: "row",
// // //     marginTop: 10,
// // //     gap: 10,
// // //   },
// // //   ytAvatar: {
// // //     width: 36,
// // //     height: 36,
// // //     borderRadius: 18,
// // //     backgroundColor: "#333",
// // //     alignItems: "center",
// // //     justifyContent: "center",
// // //     overflow: "hidden",
// // //   },
// // //   ytAvatarImg: {
// // //     width: "100%",
// // //     height: "100%",
// // //   },
// // //   ytAvatarText: {
// // //     color: "#fff",
// // //     fontSize: 15,
// // //     fontWeight: "600",
// // //   },
// // //   ytTextCol: {
// // //     flex: 1,
// // //   },
// // //   ytTitle: {
// // //     color: "#fff",
// // //     fontSize: 14,
// // //     fontWeight: "600",
// // //     lineHeight: 18,
// // //     marginBottom: 3,
// // //   },
// // //   ytChannelRow: {
// // //     flexDirection: "row",
// // //     alignItems: "center",
// // //   },
// // //   ytChannelName: {
// // //     color: "#aaa",
// // //     fontSize: 13,
// // //   },
// // //   ytMeta: {
// // //     color: "#aaa",
// // //     fontSize: 12,
// // //     marginTop: 2,
// // //   },

// // //   // ===== Shorts =====
// // //   shortsGrid: {
// // //     flexDirection: "row",
// // //     flexWrap: "wrap",
// // //     justifyContent: "space-between",
// // //     rowGap: 14,
// // //   },
// // //   shortCard: {
// // //     width: SHORT_WIDTH,
// // //   },
// // //   shortImageWrapper: {
// // //     width: SHORT_WIDTH,
// // //     height: SHORT_HEIGHT,
// // //     borderRadius: 12,
// // //     overflow: "hidden",
// // //     backgroundColor: "#18181b",
// // //   },
// // //   shortImage: {
// // //     width: "100%",
// // //     height: "100%",
// // //   },
// // //   shortOverlay: {
// // //     position: "absolute",
// // //     bottom: 0,
// // //     left: 0,
// // //     right: 0,
// // //     padding: 10,
// // //     backgroundColor: "rgba(0,0,0,0.55)",
// // //   },
// // //   shortTitle: {
// // //     color: "#fff",
// // //     fontSize: 13,
// // //     fontWeight: "600",
// // //     lineHeight: 17,
// // //   },
// // //   shortViews: {
// // //     color: "#ccc",
// // //     fontSize: 11,
// // //     marginTop: 4,
// // //   },

// // //   // ===== Vertical Feed =====
// // //   verticalCard: {
// // //     marginBottom: 20,
// // //   },
// // //   verticalThumbWrapper: {
// // //     width: "100%",
// // //     aspectRatio: 16 / 9,
// // //     borderRadius: 12,
// // //     overflow: "hidden",
// // //     backgroundColor: "#18181b",
// // //   },
// // //   verticalThumb: {
// // //     width: "100%",
// // //     height: "100%",
// // //   },
// // //   verticalInfo: {
// // //     marginTop: 10,
// // //     paddingHorizontal: 2,
// // //   },
// // //   verticalTitle: {
// // //     color: "#fff",
// // //     fontSize: 15,
// // //     fontWeight: "600",
// // //     lineHeight: 20,
// // //   },
// // //   verticalMeta: {
// // //     color: "#a1a1aa",
// // //     fontSize: 13,
// // //     marginTop: 4,
// // //   },
// // //   progressBarContainer: {
// // //     position: "absolute",
// // //     bottom: 0,
// // //     left: 0,
// // //     right: 0,
// // //     height: 3,
// // //     backgroundColor: "rgba(0,0,0,0.5)",
// // //   },
// // //   progressBarFill: {
// // //     height: "100%",
// // //     backgroundColor: "#dc2626",
// // //   },
// // //   mutedBadge: {
// // //     position: "absolute",
// // //     top: 10,
// // //     right: 10,
// // //     backgroundColor: "rgba(0,0,0,0.65)",
// // //     borderRadius: 12,
// // //     paddingHorizontal: 8,
// // //     paddingVertical: 4,
// // //   },
// // //   mutedText: {
// // //     color: "#fff",
// // //     fontSize: 13,
// // //   },
// // // });

// // import React, { useState, useEffect, useCallback, useRef } from "react";
// // import {
// //   View,
// //   Text,
// //   Image,
// //   TouchableOpacity,
// //   StyleSheet,
// //   Dimensions,
// //   ActivityIndicator,
// //   StatusBar,
// //   RefreshControl,
// //   FlatList,
// // } from "react-native";
// // import { useIsFocused, useNavigation } from "@react-navigation/native";
// // import { VideoView, useVideoPlayer } from "expo-video";
// // import {
// //   BadgeCheck,
// //   ChevronRight,
// //   Play,
// //   Plus,
// //   Check,
// // } from "lucide-react-native";
// // import Toast from "react-native-toast-message";
// // import AsyncStorage from "@react-native-async-storage/async-storage";
// // import Navbar from "./Navbar";
// // import TopicChips from "./TopicChips";
// // import { getViewSocket } from "../utils/viewSocket";
// // import { API_ORIGIN } from "../../config/api";

// // const { width: SCREEN_WIDTH } = Dimensions.get("window");

// // const BACKEND_URL = API_ORIGIN;
// // const API_BASE = `${BACKEND_URL}/api/uservideo`;
// // const LIMIT = 5;
// // const MAX_PAGES = 40;

// // const hasMorePages = (payload: any, page: number, limit: number, count: number) => {
// //   if (typeof payload?.hasMore === "boolean") return payload.hasMore;
// //   const total = Number(payload?.total ?? payload?.pagination?.total);
// //   if (Number.isFinite(total)) return total > page * limit;
// //   return count >= limit;
// // };

// // function AutoplayPreview({ uri, style }: { uri: string; style: any }) {
// //   const player = useVideoPlayer(uri, (p) => {
// //     p.loop = true;
// //     p.muted = true;
// //     p.play();
// //   });
// //   return (
// //     <VideoView
// //       player={player}
// //       style={style}
// //       contentFit="cover"
// //       nativeControls={false}
// //       allowsPictureInPicture={false}
// //     />
// //   );
// // }

// // const toMediaUrl = (value: any, fallback: string) => {
// //   if (!value) return fallback;
// //   const path = String(value).replace(/\\/g, "/");
// //   if (/^https?:\/\//i.test(path)) return path;
// //   return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
// // };

// // const normalizeVideo = (video: any = {}) => ({
// //   id: video._id || video.id,
// //   title: video.title || "Untitled video",
// //   thumb: toMediaUrl(
// //     video.thumbnail,
// //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"
// //   ),
// //   thumbnail: toMediaUrl(
// //     video.thumbnail,
// //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"
// //   ),
// //   views: Number(video.views ?? video.viewCount ?? 0),
// //   likesCount: Number(video.likesCount ?? video.likes ?? 0),
// //   videoUrl: toMediaUrl(video.videoUrl, ""),
// //   videoType: video.videoType || null,
// //   channel: video.channel || null,
// //   createdAt: video.createdAt || null,
// //   duration: video.duration ?? video.durationSeconds,
// //   uploadDate: video.uploadDate || video.createdAt || null,
// //   watchedPercent: Number(video.watchedPercent || 0),
// //   isLiked: Boolean(video.isLiked || video.userReaction === "like"),
// //   isDisliked: Boolean(video.isDisliked || video.userReaction === "dislike"),
// //   raw: video,
// // });

// // const normalizeShort = (video: any = {}) => ({
// //   ...normalizeVideo(video),
// //   isShort: true,
// //   videoType: "short",
// // });

// // const normalizeChannel = (channel: any = {}) => ({
// //   id: channel._id || channel.id || channel.channelId,
// //   title: channel.name || channel.channelName || "Subscribed Channel",
// //   thumb:
// //     channel.channelImage ||
// //     channel.avatar ||
// //     channel.image ||
// //     "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
// //   isChannel: true,
// //   videoType: "channel",
// //   raw: channel,
// // });

// // const getArray = (payload: any) => {
// //   if (Array.isArray(payload)) return payload;
// //   if (Array.isArray(payload?.videos)) return payload.videos;
// //   if (Array.isArray(payload?.data)) return payload.data;
// //   if (Array.isArray(payload?.channels)) return payload.channels;
// //   if (Array.isArray(payload?.subscribedChannels)) return payload.subscribedChannels;
// //   return [];
// // };

// // const fetchWithAuth = async (endpoint: string, params: any = {}) => {
// //   const token = await AsyncStorage.getItem("token");
// //   const headers = token ? { Authorization: `Bearer ${token}` } : {};
// //   const query = new URLSearchParams(
// //     Object.entries(params)
// //       .filter(([, v]) => v !== undefined)
// //       .map(([k, v]) => [k, String(v)])
// //   ).toString();

// //   const res = await fetch(`${API_BASE}/${endpoint}${query ? `?${query}` : ""}`, {
// //     headers,
// //   });
// //   if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
// //   const data = await res.json();
// //   if (data?.success === false) throw new Error(data.message || "Failed");
// //   return data;
// // };

// // const formatViews = (v: number = 0) => {
// //   if (v >= 1_000_000)
// //     return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
// //   if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
// //   return `${v.toLocaleString()} views`;
// // };

// // const formatDuration = (value: any) => {
// //   if (typeof value === "string" && value.includes(":")) return value;
// //   const sec = Number(value);
// //   if (!Number.isFinite(sec) || sec <= 0) return "";
// //   const total = Math.floor(sec);
// //   const h = Math.floor(total / 3600);
// //   const m = Math.floor((total % 3600) / 60);
// //   const s = total % 60;
// //   return h > 0
// //     ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
// //     : `${m}:${String(s).padStart(2, "0")}`;
// // };

// // const formatUploadTime = (value: any) => {
// //   if (!value) return "";
// //   const date = value instanceof Date ? value : new Date(value);
// //   if (Number.isNaN(date.getTime())) return "";
// //   const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
// //   if (minutes < 1) return "Just now";
// //   if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
// //   const hours = Math.floor(minutes / 60);
// //   if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
// //   const days = Math.floor(hours / 24);
// //   if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
// //   const weeks = Math.floor(days / 7);
// //   if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
// //   const months = Math.floor(days / 30);
// //   if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
// //   const years = Math.floor(days / 365);
// //   return `${years} year${years === 1 ? "" : "s"} ago`;
// // };

// // // ====================== Main Screen ======================
// // export default function NetflixStylePage() {
// //   const navigation = useNavigation<any>();
// //   const isFocused = useIsFocused();

// //   const [feed, setFeed] = useState<any[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [loadingMore, setLoadingMore] = useState(false);
// //   const [hasMore, setHasMore] = useState(true);
// //   const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
// //   const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

// //   const seenIds = useRef(new Set<string>());
// //   const pageRef = useRef({ recommended: 1, trending: 1, latest: 1 });
// //   const loadingMoreRef = useRef(false);

// //   const isShort = (item: any) => {
// //     const t = item?.videoType ?? item?.raw?.videoType ?? [];
// //     const types = (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
// //     return item?.isShort || types.some((x) => x.includes("short"));
// //   };

// //   // ====================== Load Feed ======================
// //   const loadFeed = useCallback(
// //     async (isRefresh = false) => {
// //       if (loadingMoreRef.current && !isRefresh) return;

// //       if (isRefresh) {
// //         setLoading(true);
// //         seenIds.current.clear();
// //         pageRef.current = { recommended: 1, trending: 1, latest: 1 };
// //         setHasMore(true);
// //       } else {
// //         loadingMoreRef.current = true;
// //         setLoadingMore(true);
// //       }

// //       try {
// //         const newItems: any[] = [];
// //         let attempts = 0;

// //         while (newItems.length < LIMIT && attempts < MAX_PAGES) {
// //           attempts++;

// //           // 1. Recommended
// //           if (newItems.length < LIMIT) {
// //             const payload = await fetchWithAuth("recommended", {
// //               page: pageRef.current.recommended,
// //               limit: LIMIT,
// //               category: selectedCategoryId || undefined,
// //             });
// //             const items = getArray(payload).map(normalizeVideo);
// //             pageRef.current.recommended++;

// //             for (const item of items) {
// //               const id = String(item.id);
// //               if (!id || seenIds.current.has(id)) continue;
// //               seenIds.current.add(id);
// //               newItems.push({ ...item, feedType: "recommended" });
// //               if (newItems.length >= LIMIT) break;
// //             }
// //           }

// //           // 2. Trending
// //           if (newItems.length < LIMIT) {
// //             const payload = await fetchWithAuth("trending", {
// //               page: pageRef.current.trending,
// //               limit: LIMIT,
// //               category: selectedCategoryId || undefined,
// //             });
// //             const items = getArray(payload).map(normalizeVideo);
// //             pageRef.current.trending++;

// //             for (const item of items) {
// //               const id = String(item.id);
// //               if (!id || seenIds.current.has(id)) continue;
// //               seenIds.current.add(id);
// //               newItems.push({ ...item, feedType: "trending" });
// //               if (newItems.length >= LIMIT) break;
// //             }
// //           }

// //           // 3. Latest
// //           if (newItems.length < LIMIT) {
// //             const payload = await fetchWithAuth("latest", {
// //               page: pageRef.current.latest,
// //               limit: LIMIT,
// //               category: selectedCategoryId || undefined,
// //             });
// //             const items = getArray(payload).map(normalizeVideo);
// //             pageRef.current.latest++;

// //             for (const item of items) {
// //               const id = String(item.id);
// //               if (!id || seenIds.current.has(id)) continue;
// //               seenIds.current.add(id);
// //               newItems.push({ ...item, feedType: "latest" });
// //               if (newItems.length >= LIMIT) break;
// //             }

// //             if (
// //               !hasMorePages(payload, pageRef.current.latest - 1, LIMIT, items.length) &&
// //               newItems.length === 0
// //             ) {
// //               setHasMore(false);
// //               break;
// //             }
// //           }
// //         }

// //         if (isRefresh) {
// //           setFeed(newItems);
// //         } else if (newItems.length > 0) {
// //           setFeed((prev) => [...prev, ...newItems]);
// //         } else {
// //           setHasMore(false);
// //         }
// //       } catch (e) {
// //         console.warn("Feed load error:", e);
// //         Toast.show({ type: "error", text1: "Failed to load videos" });
// //       } finally {
// //         setLoading(false);
// //         setLoadingMore(false);
// //         loadingMoreRef.current = false;
// //       }
// //     },
// //     [selectedCategoryId]
// //   );

// //   useEffect(() => {
// //     loadFeed(true);
// //   }, [selectedCategoryId]);

// //   // View count socket
// //   useEffect(() => {
// //     let active = true;
// //     let socket: any;
// //     let handler: any;

// //     getViewSocket().then((s) => {
// //       if (!active || !s) return;
// //       socket = s;
// //       handler = ({ videoId, views }: any) => {
// //         setFeed((prev) =>
// //           prev.map((item) =>
// //             String(item.id) === String(videoId) ? { ...item, views } : item
// //           )
// //         );
// //       };
// //       socket.on("view-count-updated", handler);
// //     });

// //     return () => {
// //       active = false;
// //       if (socket && handler) socket.off("view-count-updated", handler);
// //     };
// //   }, []);

// //   const onRefresh = async () => {
// //     setRefreshing(true);
// //     setActiveVideoId(null);
// //     await loadFeed(true);
// //     setRefreshing(false);
// //   };

// //   const handleItemClick = (item: any) => {
// //     setActiveVideoId(null);
// //     if (item?.isChannel) {
// //       navigation.navigate("SubscribedChannels", { id: item.id });
// //       return;
// //     }
// //     if (isShort(item)) {
// //       navigation.navigate("MainTabs", {
// //         screen: "Shorts",
// //         params: { video: item },
// //       });
// //       return;
// //     }
// //     navigation.navigate("VideoDetail", { id: item.id, item, video: item });
// //   };

// //   const handleAddToWatchLater = async (item: any) => {
// //     try {
// //       const token = await AsyncStorage.getItem("token");
// //       if (!token) {
// //         Toast.show({ type: "error", text1: "Please login first" });
// //         return { success: false };
// //       }
// //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// //         method: "POST",
// //         headers: {
// //           Authorization: `Bearer ${token}`,
// //           "Content-Type": "application/json",
// //         },
// //       });
// //       const data = await res.json().catch(() => ({}));
// //       if (data.success) {
// //         Toast.show({
// //           type: "success",
// //           text1: data.message || "Added to Watch Later",
// //         });
// //         return { success: true };
// //       }
// //       Toast.show({ type: "error", text1: data.message || "Failed" });
// //       return { success: false };
// //     } catch {
// //       Toast.show({ type: "error", text1: "Something went wrong" });
// //       return { success: false };
// //     }
// //   };

// //   const handleRemoveFromWatchLater = async (item: any) => {
// //     try {
// //       const token = await AsyncStorage.getItem("token");
// //       if (!token) return { success: false };
// //       const res = await fetch(`${API_BASE}/watch-later/${item.id}`, {
// //         method: "DELETE",
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       const data = await res.json().catch(() => ({}));
// //       if (res.ok && data?.success !== false) {
// //         Toast.show({ type: "success", text1: "Removed from Watch Later" });
// //         return { success: true };
// //       }
// //       return { success: false };
// //     } catch {
// //       return { success: false };
// //     }
// //   };

// //   // Autoplay
// //   const viewabilityConfig = useRef({
// //     itemVisiblePercentThreshold: 60,
// //     minimumViewTime: 250,
// //   }).current;

// //   const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
// //     if (viewableItems?.length > 0) {
// //       const most = viewableItems.reduce((a: any, b: any) =>
// //         (b?.percentVisible ?? 0) > (a?.percentVisible ?? 0) ? b : a
// //       );
// //       const item = most?.item;
// //       if (item?.id && !isShort(item) && item.videoUrl) {
// //         setActiveVideoId(item.id);
// //       } else {
// //         setActiveVideoId(null);
// //       }
// //     } else {
// //       setActiveVideoId(null);
// //     }
// //   }).current;

// //   // ====================== YouTube Style Full Width Card ======================
// //   const renderVideoCard = ({ item }: { item: any }) => {
// //     const isActive = isFocused && activeVideoId === item.id && !!item.videoUrl;
// //     const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));
// //     const durationText = formatDuration(item.duration);

// //     const channel = item.channel || {};
// //     const channelName =
// //       channel?.name || channel?.channelName || item.channelName || "Unknown Channel";
// //     const avatarUrl =
// //       channel?.avatar ||
// //       channel?.profileImage ||
// //       channel?.channelImage ||
// //       channel?.image ||
// //       "";
// //     const isVerified = Boolean(channel?.isVerified || channel?.verified);

// //     return (
// //       <TouchableOpacity
// //         activeOpacity={0.95}
// //         onPress={() => handleItemClick(item)}
// //         style={styles.card}
// //       >
// //         {/* Thumbnail */}
// //         <View style={styles.thumbWrapper}>
// //           {isActive ? (
// //             <AutoplayPreview uri={item.videoUrl} style={styles.thumb} />
// //           ) : (
// //             <Image
// //               source={{ uri: item.thumb || item.thumbnail }}
// //               style={styles.thumb}
// //               resizeMode="cover"
// //             />
// //           )}

// //           {/* Duration */}
// //           {durationText ? (
// //             <View style={styles.durationBadge}>
// //               <Text style={styles.durationText}>{durationText}</Text>
// //             </View>
// //           ) : null}

// //           {/* Progress */}
// //           {progress > 0 && (
// //             <View style={styles.progressTrack}>
// //               <View style={[styles.progressFill, { width: `${progress}%` }]} />
// //             </View>
// //           )}

// //           {/* Muted badge */}
// //           {isActive && (
// //             <View style={styles.mutedBadge}>
// //               <Text style={styles.mutedText}>🔇</Text>
// //             </View>
// //           )}
// //         </View>

// //         {/* Info Row */}
// //         <View style={styles.infoRow}>
// //           {/* Avatar */}
// //           <View style={styles.avatar}>
// //             {avatarUrl ? (
// //               <Image
// //                 source={{ uri: toMediaUrl(avatarUrl, "") }}
// //                 style={styles.avatarImg}
// //               />
// //             ) : (
// //               <Text style={styles.avatarText}>
// //                 {channelName.charAt(0).toUpperCase()}
// //               </Text>
// //             )}
// //           </View>

// //           {/* Title + Meta */}
// //           <View style={styles.textCol}>
// //             <Text style={styles.title} numberOfLines={2}>
// //               {item.title}
// //             </Text>

// //             <View style={styles.channelRow}>
// //               <Text style={styles.channelName} numberOfLines={1}>
// //                 {channelName}
// //               </Text>
// //               {isVerified && (
// //                 <BadgeCheck size={14} color="#aaa" style={{ marginLeft: 4 }} />
// //               )}
// //             </View>

// //             <Text style={styles.meta} numberOfLines={1}>
// //               {formatViews(item.views)}
// //               {item.uploadDate || item.createdAt
// //                 ? ` • ${formatUploadTime(item.uploadDate || item.createdAt)}`
// //                 : ""}
// //             </Text>
// //           </View>
// //         </View>
// //       </TouchableOpacity>
// //     );
// //   };

// //   return (
// //     <View style={styles.container}>
// //       <StatusBar barStyle="light-content" backgroundColor="#000" />
// //       <Navbar onMenuPress={() => {}} points={0} />

// //       <TopicChips
// //         onTopicChange={(_, categoryId) => setSelectedCategoryId(categoryId || null)}
// //       />

// //       <FlatList
// //         data={feed}
// //         keyExtractor={(item, index) => `${item.id}-${index}`}
// //         renderItem={renderVideoCard}
// //         showsVerticalScrollIndicator={false}
// //         contentContainerStyle={styles.listContent}
// //         onEndReached={() => {
// //           if (hasMore && !loadingMore && !loading) {
// //             loadFeed(false);
// //           }
// //         }}
// //         onEndReachedThreshold={0.4}
// //         onViewableItemsChanged={onViewableItemsChanged}
// //         viewabilityConfig={viewabilityConfig}
// //         ListHeaderComponent={
// //           loading && feed.length === 0 ? (
// //             <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
// //           ) : null
// //         }
// //         ListFooterComponent={
// //           loadingMore ? (
// //             <ActivityIndicator color="#fff" style={{ marginVertical: 24 }} />
// //           ) : !hasMore && feed.length > 0 ? (
// //             <Text style={styles.endText}>No more videos</Text>
// //           ) : null
// //         }
// //         refreshControl={
// //           <RefreshControl
// //             refreshing={refreshing}
// //             onRefresh={onRefresh}
// //             tintColor="#fff"
// //             colors={["#fff"]}
// //           />
// //         }
// //       />
// //     </View>
// //   );
// // }

// // // ====================== Styles ======================
// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: "#000",
// //   },
// //   listContent: {
// //     paddingBottom: 80,
// //   },

// //   // ===== Full Width YouTube Card =====
// //   card: {
// //     marginBottom: 18,
// //   },
// //   thumbWrapper: {
// //     width: "100%",
// //     aspectRatio: 16 / 9,
// //     backgroundColor: "#111",
// //     position: "relative",
// //   },
// //   thumb: {
// //     width: "100%",
// //     height: "100%",
// //   },
// //   durationBadge: {
// //     position: "absolute",
// //     bottom: 8,
// //     right: 8,
// //     backgroundColor: "rgba(0,0,0,0.85)",
// //     paddingHorizontal: 6,
// //     paddingVertical: 2,
// //     borderRadius: 4,
// //   },
// //   durationText: {
// //     color: "#fff",
// //     fontSize: 12,
// //     fontWeight: "600",
// //   },
// //   progressTrack: {
// //     position: "absolute",
// //     bottom: 0,
// //     left: 0,
// //     right: 0,
// //     height: 3,
// //     backgroundColor: "rgba(255,255,255,0.3)",
// //   },
// //   progressFill: {
// //     height: "100%",
// //     backgroundColor: "#f00",
// //   },
// //   mutedBadge: {
// //     position: "absolute",
// //     top: 10,
// //     right: 10,
// //     backgroundColor: "rgba(0,0,0,0.65)",
// //     borderRadius: 12,
// //     paddingHorizontal: 8,
// //     paddingVertical: 4,
// //   },
// //   mutedText: {
// //     color: "#fff",
// //     fontSize: 13,
// //   },

// //   // Info
// //   infoRow: {
// //     flexDirection: "row",
// //     paddingHorizontal: 12,
// //     paddingTop: 12,
// //     gap: 12,
// //   },
// //   avatar: {
// //     width: 40,
// //     height: 40,
// //     borderRadius: 20,
// //     backgroundColor: "#333",
// //     alignItems: "center",
// //     justifyContent: "center",
// //     overflow: "hidden",
// //   },
// //   avatarImg: {
// //     width: "100%",
// //     height: "100%",
// //   },
// //   avatarText: {
// //     color: "#fff",
// //     fontSize: 16,
// //     fontWeight: "600",
// //   },
// //   textCol: {
// //     flex: 1,
// //   },
// //   title: {
// //     color: "#fff",
// //     fontSize: 15,
// //     fontWeight: "600",
// //     lineHeight: 20,
// //     marginBottom: 3,
// //   },
// //   channelRow: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //   },
// //   channelName: {
// //     color: "#aaa",
// //     fontSize: 13,
// //   },
// //   meta: {
// //     color: "#aaa",
// //     fontSize: 13,
// //     marginTop: 2,
// //   },

// //   endText: {
// //     color: "#666",
// //     textAlign: "center",
// //     marginVertical: 24,
// //     fontSize: 14,
// //   },
// // });

// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
//   useMemo,
// } from "react";
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   ActivityIndicator,
//   StatusBar,
//   RefreshControl,
//   FlatList,
// } from "react-native";
// import { useIsFocused, useNavigation } from "@react-navigation/native";
// import { VideoView, useVideoPlayer } from "expo-video";
// import { BadgeCheck, ChevronRight } from "lucide-react-native";
// import Toast from "react-native-toast-message";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Navbar from "./Navbar";
// import TopicChips from "./TopicChips";
// import { getViewSocket } from "../utils/viewSocket";
// import { API_ORIGIN } from "../../config/api";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");

// const BACKEND_URL = API_ORIGIN;
// const API_BASE = `${BACKEND_URL}/api/uservideo`;
// const LIMIT = 5;

// const hasMorePages = (payload: any, page: number, limit: number, count: number) => {
//   if (typeof payload?.hasMore === "boolean") return payload.hasMore;
//   const total = Number(payload?.total ?? payload?.pagination?.total);
//   if (Number.isFinite(total)) return total > page * limit;
//   return count >= limit;
// };

// function AutoplayPreview({ uri, style }: { uri: string; style: any }) {
//   const player = useVideoPlayer(uri, (p) => {
//     p.loop = true;
//     p.muted = true;
//     p.play();
//   });
//   return (
//     <VideoView
//       player={player}
//       style={style}
//       contentFit="cover"
//       nativeControls={false}
//       allowsPictureInPicture={false}
//     />
//   );
// }

// const toMediaUrl = (value: any, fallback: string) => {
//   if (!value) return fallback;
//   const path = String(value).replace(/\\/g, "/");
//   if (/^https?:\/\//i.test(path)) return path;
//   return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
// };

// const normalizeVideo = (video: any = {}) => ({
//   id: video._id || video.id,
//   title: video.title || "Untitled video",
//   thumb: toMediaUrl(video.thumbnail, "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"),
//   thumbnail: toMediaUrl(video.thumbnail, "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"),
//   views: Number(video.views ?? video.viewCount ?? 0),
//   videoUrl: toMediaUrl(video.videoUrl, ""),
//   videoType: video.videoType || null,
//   channel: video.channel || null,
//   createdAt: video.createdAt || null,
//   duration: video.duration ?? video.durationSeconds,
//   uploadDate: video.uploadDate || video.createdAt || null,
//   watchedPercent: Number(video.watchedPercent || 0),
//   raw: video,
// });

// const normalizeShort = (video: any = {}) => ({
//   ...normalizeVideo(video),
//   isShort: true,
//   videoType: "short",
// });

// const normalizeChannel = (channel: any = {}) => ({
//   id: channel._id || channel.id || channel.channelId,
//   title: channel.name || channel.channelName || "Subscribed Channel",
//   thumb: channel.channelImage || channel.avatar || channel.image || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
//   isChannel: true,
//   videoType: "channel",
//   raw: channel,
// });

// const getArray = (payload: any) => {
//   if (Array.isArray(payload)) return payload;
//   if (Array.isArray(payload?.videos)) return payload.videos;
//   if (Array.isArray(payload?.data)) return payload.data;
//   if (Array.isArray(payload?.channels)) return payload.channels;
//   if (Array.isArray(payload?.subscribedChannels)) return payload.subscribedChannels;
//   return [];
// };

// const fetchWithAuth = async (endpoint: string, params: any = {}) => {
//   const token = await AsyncStorage.getItem("token");
//   const headers = token ? { Authorization: `Bearer ${token}` } : {};
//   const query = new URLSearchParams(
//     Object.entries(params)
//       .filter(([, v]) => v !== undefined)
//       .map(([k, v]) => [k, String(v)])
//   ).toString();

//   const res = await fetch(`${API_BASE}/${endpoint}${query ? `?${query}` : ""}`, { headers });
//   if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
//   const data = await res.json();
//   if (data?.success === false) throw new Error(data.message || "Failed");
//   return data;
// };

// const formatViews = (v: number = 0) => {
//   if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
//   if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
//   return `${v.toLocaleString()} views`;
// };

// const formatDuration = (value: any) => {
//   if (typeof value === "string" && value.includes(":")) return value;
//   const sec = Number(value);
//   if (!Number.isFinite(sec) || sec <= 0) return "";
//   const total = Math.floor(sec);
//   const h = Math.floor(total / 3600);
//   const m = Math.floor((total % 3600) / 60);
//   const s = total % 60;
//   return h > 0
//     ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
//     : `${m}:${String(s).padStart(2, "0")}`;
// };

// const formatUploadTime = (value: any) => {
//   if (!value) return "";
//   const date = value instanceof Date ? value : new Date(value);
//   if (Number.isNaN(date.getTime())) return "";
//   const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
//   if (minutes < 1) return "Just now";
//   if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
//   const hours = Math.floor(minutes / 60);
//   if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
//   const days = Math.floor(hours / 24);
//   if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
//   const weeks = Math.floor(days / 7);
//   if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
//   const months = Math.floor(days / 30);
//   if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
//   const years = Math.floor(days / 365);
//   return `${years} year${years === 1 ? "" : "s"} ago`;
// };

// const VideoFeedRow = React.memo(function VideoFeedRow({
//   item,
//   isActive,
//   onPress,
// }: {
//   item: any;
//   isActive: boolean;
//   onPress: (item: any) => void;
// }) {
//   const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));
//   const durationText = formatDuration(item.duration);
//   const channel = item.channel || {};
//   const channelName =
//     channel?.name ||
//     channel?.channelName ||
//     item.channelName ||
//     "Unknown Channel";
//   const avatarUrl =
//     channel?.avatar ||
//     channel?.profileImage ||
//     channel?.channelImage ||
//     channel?.image ||
//     "";
//   const isVerified = Boolean(channel?.isVerified || channel?.verified);

//   return (
//     <TouchableOpacity
//       activeOpacity={0.95}
//       onPress={() => onPress(item)}
//       style={styles.card}
//     >
//       <View style={styles.thumbWrapper}>
//         {isActive ? (
//           <AutoplayPreview uri={item.videoUrl} style={styles.thumb} />
//         ) : (
//           <Image
//             source={{ uri: item.thumb || item.thumbnail }}
//             style={styles.thumb}
//             resizeMode="cover"
//           />
//         )}

//         {durationText ? (
//           <View style={styles.durationBadge}>
//             <Text style={styles.durationText}>{durationText}</Text>
//           </View>
//         ) : null}

//         {progress > 0 && (
//           <View style={styles.progressTrack}>
//             <View style={[styles.progressFill, { width: `${progress}%` }]} />
//           </View>
//         )}

//         {isActive && (
//           <View style={styles.mutedBadge}>
//             <Text style={styles.mutedText}>🔇</Text>
//           </View>
//         )}
//       </View>

//       <View style={styles.infoRow}>
//         <View style={styles.avatar}>
//           {avatarUrl ? (
//             <Image
//               source={{ uri: toMediaUrl(avatarUrl, "") }}
//               style={styles.avatarImg}
//             />
//           ) : (
//             <Text style={styles.avatarText}>
//               {channelName.charAt(0).toUpperCase()}
//             </Text>
//           )}
//         </View>

//         <View style={styles.textCol}>
//           <Text style={styles.title} numberOfLines={2}>
//             {item.title}
//           </Text>
//           <View style={styles.channelRow}>
//             <Text style={styles.channelName} numberOfLines={1}>
//               {channelName}
//             </Text>
//             {isVerified && (
//               <BadgeCheck
//                 size={14}
//                 color="#aaa"
//                 style={{ marginLeft: 4 }}
//               />
//             )}
//           </View>
//           <Text style={styles.meta} numberOfLines={1}>
//             {formatViews(item.views)}
//             {item.uploadDate || item.createdAt
//               ? ` • ${formatUploadTime(item.uploadDate || item.createdAt)}`
//               : ""}
//           </Text>
//         </View>
//       </View>
//     </TouchableOpacity>
//   );
// });

// // ====================== Main ======================
// export function DashboardScreen() {
//   const navigation = useNavigation<any>();
//   const isFocused = useIsFocused();

//   // Primary (Limit 5)
//   const [recommended, setRecommended] = useState<any[]>([]);
//   const [trending, setTrending] = useState<any[]>([]);
//   const [latest, setLatest] = useState<any[]>([]);
//   const [trendingShorts, setTrendingShorts] = useState<any[]>([]);
//   const [subscriptions, setSubscriptions] = useState<any[]>([]);
//   const [topShorts, setTopShorts] = useState<any[]>([]);

//   // Remaining
//   const [moreRecommended, setMoreRecommended] = useState<any[]>([]);
//   const [moreTrending, setMoreTrending] = useState<any[]>([]);
//   const [moreLatest, setMoreLatest] = useState<any[]>([]);
//   const [moreTrendingShorts, setMoreTrendingShorts] = useState<any[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
//   const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

//   const seenIds = useRef(new Set<string>());

//   const isShort = (item: any) => {
//     const t = item?.videoType ?? item?.raw?.videoType ?? [];
//     const types = (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
//     return item?.isShort || types.some((x) => x.includes("short"));
//   };

//   // ====================== Load All Data ======================
//   const loadAll = useCallback(async () => {
//     try {
//       setLoading(true);
//       seenIds.current.clear();

//       const [
//         recData,
//         trenData,
//         latData,
//         shortData,
//         subData,
//         topShortData,
//         moreRecData,
//         moreTrenData,
//         moreLatData,
//         moreShortData,
//       ] = await Promise.all([
//         fetchWithAuth("recommended", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
//         fetchWithAuth("trending", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
//         fetchWithAuth("latest", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
//         fetchWithAuth("trending-shorts", { page: 1, limit: LIMIT }),
//         fetchWithAuth("subscribed-channels"),
//         fetchWithAuth("trending-shorts", { page: 2, limit: LIMIT }),
//         // Remaining
//         fetchWithAuth("recommended", { page: 2, limit: LIMIT, category: selectedCategoryId || undefined }),
//         fetchWithAuth("trending", { page: 2, limit: LIMIT, category: selectedCategoryId || undefined }),
//         fetchWithAuth("latest", { page: 2, limit: LIMIT, category: selectedCategoryId || undefined }),
//         fetchWithAuth("trending-shorts", { page: 3, limit: LIMIT }),
//       ]);

//       const mark = (list: any[]) => list.forEach((i) => i?.id && seenIds.current.add(String(i.id)));

//       const rec = getArray(recData).map(normalizeVideo);
//       const tren = getArray(trenData).map(normalizeVideo);
//       const lat = getArray(latData).map(normalizeVideo);
//       const shorts = getArray(shortData).map(normalizeShort);
//       const subs = getArray(subData).map(normalizeChannel).slice(0, LIMIT);
//       const topS = getArray(topShortData).map(normalizeShort);

//       const moreRec = getArray(moreRecData).map(normalizeVideo).filter((i) => !seenIds.current.has(String(i.id)));
//       const moreTren = getArray(moreTrenData).map(normalizeVideo).filter((i) => !seenIds.current.has(String(i.id)));
//       const moreLat = getArray(moreLatData).map(normalizeVideo).filter((i) => !seenIds.current.has(String(i.id)));
//       const moreShorts = getArray(moreShortData).map(normalizeShort).filter((i) => !seenIds.current.has(String(i.id)));

//       mark(rec);
//       mark(tren);
//       mark(lat);
//       mark(shorts);
//       mark(topS);
//       mark(moreRec);
//       mark(moreTren);
//       mark(moreLat);
//       mark(moreShorts);

//       setRecommended(rec);
//       setTrending(tren);
//       setLatest(lat);
//       setTrendingShorts(shorts);
//       setSubscriptions(subs);
//       setTopShorts(topS);

//       setMoreRecommended(moreRec);
//       setMoreTrending(moreTren);
//       setMoreLatest(moreLat);
//       setMoreTrendingShorts(moreShorts);
//     } catch (e) {
//       console.warn(e);
//       Toast.show({ type: "error", text1: "Failed to load feed" });
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedCategoryId]);

//   useEffect(() => {
//     loadAll();
//   }, [loadAll]);

//   // View count socket
//   useEffect(() => {
//     let active = true;
//     let socket: any;
//     let handler: any;

//     getViewSocket().then((s) => {
//       if (!active || !s) return;
//       socket = s;
//       handler = ({ videoId, views }: any) => {
//         const upd = (list: any[]) =>
//           list.map((i) => (String(i.id) === String(videoId) ? { ...i, views } : i));
//         setRecommended(upd);
//         setTrending(upd);
//         setLatest(upd);
//         setMoreRecommended(upd);
//         setMoreTrending(upd);
//         setMoreLatest(upd);
//         setTrendingShorts((p) => upd(p));
//         setTopShorts((p) => upd(p));
//         setMoreTrendingShorts((p) => upd(p));
//       };
//       socket.on("view-count-updated", handler);
//     });

//     return () => {
//       active = false;
//       if (socket && handler) socket.off("view-count-updated", handler);
//     };
//   }, []);

//   const onRefresh = async () => {
//     setRefreshing(true);
//     setActiveVideoId(null);
//     await loadAll();
//     setRefreshing(false);
//   };

//   const handleItemClick = useCallback((item: any) => {
//     setActiveVideoId(null);
//     if (item?.isChannel) {
//       navigation.navigate("SubscribedChannels", { id: item.id });
//       return;
//     }
//     if (isShort(item)) {
//       navigation.navigate("MainTabs", { screen: "Shorts", params: { video: item } });
//       return;
//     }
//     navigation.navigate("VideoDetail", { id: item.id, item, video: item });
//   }, [navigation]);

//   const handleSectionPress = useCallback((type: string) => {
//     navigation.navigate("ViewAll", { type });
//   }, [navigation]);

//   // Autoplay
//   const viewabilityConfig = useRef({
//     itemVisiblePercentThreshold: 60,
//     minimumViewTime: 250,
//   }).current;

//   const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
//     if (viewableItems?.length > 0) {
//       const most = viewableItems.reduce((a: any, b: any) =>
//         (b?.percentVisible ?? 0) > (a?.percentVisible ?? 0) ? b : a
//       );
//       const item = most?.item;
//       if (item?.id && !isShort(item) && item.videoUrl) {
//         setActiveVideoId(item.id);
//       } else {
//         setActiveVideoId(null);
//       }
//     } else {
//       setActiveVideoId(null);
//     }
//   }).current;

//   const listData = useMemo(() => {
//     if (loading) return [{ id: "loading", type: "loading" }];

//     const sections = [
//       { id: "recommended", title: "Recommended for you", type: "recommended", data: recommended },
//       { id: "trending", title: "Trending Videos", type: "trending", data: trending },
//       { id: "latest", title: "Latest Videos", type: "latest", data: latest },
//       { id: "trending-shorts", title: "Trending Shorts", type: "shorts", data: trendingShorts },
//       { id: "subscriptions", title: "From your Subscriptions", type: "subscriptions", data: subscriptions },
//       { id: "top-shorts", title: "Top Shorts", type: "top-shorts", data: topShorts },
//       { id: "more-recommended", title: "Recommended for you", type: "recommended", data: moreRecommended },
//       { id: "more-trending", title: "Trending Videos", type: "trending", data: moreTrending },
//       { id: "more-latest", title: "Latest Videos", type: "latest", data: moreLatest },
//       { id: "more-trending-shorts", title: "Trending Shorts", type: "shorts", data: moreTrendingShorts },
//     ];

//     return sections.flatMap((section) => {
//       if (section.data.length === 0) return [];
//       return [
//         {
//           id: `${section.id}-header`,
//           type: "section-header",
//           title: section.title,
//           sectionType: section.type,
//         },
//         ...section.data.map((item) => ({
//           ...item,
//           id: item.id,
//           type: "video",
//           rowKey: `${section.id}:${String(item.id)}`,
//         })),
//       ];
//     });
//   }, [
//     loading,
//     recommended,
//     trending,
//     latest,
//     trendingShorts,
//     subscriptions,
//     topShorts,
//     moreRecommended,
//     moreTrending,
//     moreLatest,
//     moreTrendingShorts,
//   ]);

//   const renderItem = useCallback(({ item }: { item: any }) => {
//     if (item.type === "loading") {
//       return <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />;
//     }
//     if (item.type === "section-header") {
//       return (
//         <View style={styles.section}>
//           <TouchableOpacity
//             style={styles.sectionHeader}
//             onPress={() => handleSectionPress(item.sectionType)}
//           >
//             <Text style={styles.sectionTitle}>{item.title}</Text>
//             <ChevronRight size={20} color="#a1a1aa" />
//           </TouchableOpacity>
//         </View>
//       );
//     }
//     return (
//       <VideoFeedRow
//         item={item}
//         isActive={isFocused && activeVideoId === item.id && !!item.videoUrl}
//         onPress={handleItemClick}
//       />
//     );
//   }, [activeVideoId, handleItemClick, handleSectionPress, isFocused]);

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#000" />
//       <Navbar onMenuPress={() => {}} points={0} />

//       <TopicChips
//         onTopicChange={(_, categoryId) => setSelectedCategoryId(categoryId || null)}
//       />

//       <FlatList
//         data={listData}
//         keyExtractor={(item) => item.rowKey || item.id}
//         renderItem={renderItem}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.listContent}
//         onViewableItemsChanged={onViewableItemsChanged}
//         viewabilityConfig={viewabilityConfig}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             tintColor="#fff"
//             colors={["#fff"]}
//           />
//         }
//       />
//     </View>
//   );
// }

// export default DashboardScreen;

// // ====================== Styles ======================
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000",
//   },
//   listContent: {
//     paddingBottom: 80,
//   },
//   section: {
//     marginBottom: 28,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 12,
//     marginBottom: 12,
//     gap: 6,
//   },
//   sectionTitle: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "700",
//   },

//   // Full width card
//   card: {
//     marginBottom: 18,
//   },
//   thumbWrapper: {
//     width: "100%",
//     aspectRatio: 16 / 9,
//     backgroundColor: "#111",
//     position: "relative",
//   },
//   thumb: {
//     width: "100%",
//     height: "100%",
//   },
//   durationBadge: {
//     position: "absolute",
//     bottom: 8,
//     right: 8,
//     backgroundColor: "rgba(0,0,0,0.85)",
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   durationText: {
//     color: "#fff",
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   progressTrack: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 3,
//     backgroundColor: "rgba(255,255,255,0.3)",
//   },
//   progressFill: {
//     height: "100%",
//     backgroundColor: "#f00",
//   },
//   mutedBadge: {
//     position: "absolute",
//     top: 10,
//     right: 10,
//     backgroundColor: "rgba(0,0,0,0.65)",
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   mutedText: {
//     color: "#fff",
//     fontSize: 13,
//   },
//   infoRow: {
//     flexDirection: "row",
//     paddingHorizontal: 12,
//     paddingTop: 12,
//     gap: 12,
//   },
//   avatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#333",
//     alignItems: "center",
//     justifyContent: "center",
//     overflow: "hidden",
//   },
//   avatarImg: {
//     width: "100%",
//     height: "100%",
//   },
//   avatarText: {
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   textCol: {
//     flex: 1,
//   },
//   title: {
//     color: "#fff",
//     fontSize: 15,
//     fontWeight: "600",
//     lineHeight: 20,
//     marginBottom: 3,
//   },
//   channelRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   channelName: {
//     color: "#aaa",
//     fontSize: 13,
//   },
//   meta: {
//     color: "#aaa",
//     fontSize: 13,
//     marginTop: 2,
//   },
// });

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  FlatList,
} from "react-native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { VideoView, useVideoPlayer } from "expo-video";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Navbar from "./Navbar";
import TopicChips from "./TopicChips";
import { getViewSocket } from "../utils/viewSocket";
import { API_ORIGIN } from "../../config/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SHORT_GAP = 10;
const SHORT_WIDTH = (SCREEN_WIDTH - 32 - SHORT_GAP) / 2;
const SHORT_HEIGHT = SHORT_WIDTH * (16 / 9);

const BACKEND_URL = API_ORIGIN;
const API_BASE = `${BACKEND_URL}/api/uservideo`;
const LIMIT = 5;

function AutoplayPreview({ uri, style }: { uri: string; style: any }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

const toMediaUrl = (value: any, fallback: string) => {
  if (!value) return fallback;
  const path = String(value).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
};

const normalizeVideo = (video: any = {}) => ({
  id: video._id || video.id,
  title: video.title || "Untitled video",
  thumb: toMediaUrl(
    video.thumbnail,
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"
  ),
  thumbnail: toMediaUrl(
    video.thumbnail,
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop"
  ),
  views: Number(video.views ?? video.viewCount ?? 0),
  videoUrl: toMediaUrl(video.videoUrl, ""),
  videoType: video.videoType || null,
  channel: video.channel || null,
  createdAt: video.createdAt || null,
  duration: video.duration ?? video.durationSeconds,
  uploadDate: video.uploadDate || video.createdAt || null,
  watchedPercent: Number(video.watchedPercent || 0),
  raw: video,
});

const normalizeShort = (video: any = {}) => ({
  ...normalizeVideo(video),
  isShort: true,
  videoType: "short",
});

const normalizeChannel = (channel: any = {}) => ({
  id: channel._id || channel.id || channel.channelId,
  title: channel.name || channel.channelName || "Subscribed Channel",
  thumb:
    channel.channelImage ||
    channel.avatar ||
    channel.image ||
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=225&fit=crop",
  isChannel: true,
  videoType: "channel",
  raw: channel,
});

const getArray = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.videos)) return payload.videos;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.channels)) return payload.channels;
  if (Array.isArray(payload?.subscribedChannels)) return payload.subscribedChannels;
  return [];
};

const fetchWithAuth = async (endpoint: string, params: any = {}) => {
  const token = await AsyncStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  const res = await fetch(`${API_BASE}/${endpoint}${query ? `?${query}` : ""}`, {
    headers,
  });
  if (!res.ok) throw new Error(`${endpoint} failed (${res.status})`);
  const data = await res.json();
  if (data?.success === false) throw new Error(data.message || "Failed");
  return data;
};

const formatViews = (v: number = 0) => {
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  return `${v.toLocaleString()} views`;
};

const formatDuration = (value: any) => {
  if (typeof value === "string" && value.includes(":")) return value;
  const sec = Number(value);
  if (!Number.isFinite(sec) || sec <= 0) return "";
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
};

const formatUploadTime = (value: any) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

// ====================== Normal Video Card ======================
const VideoFeedRow = React.memo(function VideoFeedRow({
  item,
  isActive,
  onPress,
}: {
  item: any;
  isActive: boolean;
  onPress: (item: any) => void;
}) {
  const progress = Math.min(100, Math.max(0, item.watchedPercent || 0));
  const durationText = formatDuration(item.duration);
  const channel = item.channel || {};
  const channelName =
    channel?.name || channel?.channelName || item.channelName || "Unknown Channel";
  const avatarUrl =
    channel?.avatar ||
    channel?.profileImage ||
    channel?.channelImage ||
    channel?.image ||
    "";
  const isVerified = Boolean(channel?.isVerified || channel?.verified);

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => onPress(item)}
      style={styles.card}
    >
      <View style={styles.thumbWrapper}>
        {isActive ? (
          <AutoplayPreview uri={item.videoUrl} style={styles.thumb} />
        ) : (
          <Image
            source={{ uri: item.thumb || item.thumbnail }}
            style={styles.thumb}
            resizeMode="cover"
          />
        )}

        {durationText ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{durationText}</Text>
          </View>
        ) : null}

        {progress > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}

        {isActive && (
          <View style={styles.mutedBadge}>
            <Text style={styles.mutedText}>🔇</Text>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image
              source={{ uri: toMediaUrl(avatarUrl, "") }}
              style={styles.avatarImg}
            />
          ) : (
            <Text style={styles.avatarText}>
              {channelName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.channelRow}>
            <Text style={styles.channelName} numberOfLines={1}>
              {channelName}
            </Text>
            {isVerified && (
              <BadgeCheck size={14} color="#aaa" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {formatViews(item.views)}
            {item.uploadDate || item.createdAt
              ? ` • ${formatUploadTime(item.uploadDate || item.createdAt)}`
              : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ====================== Short Card (Grid) ======================
const ShortCard = React.memo(function ShortCard({
  item,
  onPress,
}: {
  item: any;
  onPress: (item: any) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      style={styles.shortCard}
    >
      <View style={styles.shortThumbWrapper}>
        <Image
          source={{ uri: item.thumbnail || item.thumb }}
          style={styles.shortThumb}
          resizeMode="cover"
        />
        <View style={styles.shortOverlay}>
          <Text style={styles.shortTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.shortViews}>
            {formatViews(item.views)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ====================== Main ======================
export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [recommended, setRecommended] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [trendingShorts, setTrendingShorts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [topShorts, setTopShorts] = useState<any[]>([]);

  const [moreRecommended, setMoreRecommended] = useState<any[]>([]);
  const [moreTrending, setMoreTrending] = useState<any[]>([]);
  const [moreLatest, setMoreLatest] = useState<any[]>([]);
  const [moreTrendingShorts, setMoreTrendingShorts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const seenIds = useRef(new Set<string>());

  const isShort = (item: any) => {
    const t = item?.videoType ?? item?.raw?.videoType ?? [];
    const types = (Array.isArray(t) ? t : [t]).map((x) => String(x).toLowerCase());
    return item?.isShort || types.some((x) => x.includes("short"));
  };

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      seenIds.current.clear();

      const [
        recData,
        trenData,
        latData,
        shortData,
        subData,
        topShortData,
        moreRecData,
        moreTrenData,
        moreLatData,
        moreShortData,
      ] = await Promise.all([
        fetchWithAuth("recommended", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
        fetchWithAuth("trending", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
        fetchWithAuth("latest", { page: 1, limit: LIMIT, category: selectedCategoryId || undefined }),
        fetchWithAuth("trending-shorts", { page: 1, limit: LIMIT }),
        fetchWithAuth("subscribed-channels"),
        fetchWithAuth("trending-shorts", { page: 2, limit: LIMIT }),
        fetchWithAuth("recommended", { page: 2, limit: LIMIT, category: selectedCategoryId || undefined }),
        fetchWithAuth("trending", { page: 2, limit: LIMIT, category: selectedCategoryId || undefined }),
        fetchWithAuth("latest", { page: 2, limit: LIMIT, category: selectedCategoryId || undefined }),
        fetchWithAuth("trending-shorts", { page: 3, limit: LIMIT }),
      ]);

      const mark = (list: any[]) =>
        list.forEach((i) => i?.id && seenIds.current.add(String(i.id)));

      const rec = getArray(recData).map(normalizeVideo);
      const tren = getArray(trenData).map(normalizeVideo);
      const lat = getArray(latData).map(normalizeVideo);
      const shorts = getArray(shortData).map(normalizeShort);
      const subs = getArray(subData).map(normalizeChannel).slice(0, LIMIT);
      const topS = getArray(topShortData).map(normalizeShort);

      const moreRec = getArray(moreRecData)
        .map(normalizeVideo)
        .filter((i) => !seenIds.current.has(String(i.id)));
      const moreTren = getArray(moreTrenData)
        .map(normalizeVideo)
        .filter((i) => !seenIds.current.has(String(i.id)));
      const moreLat = getArray(moreLatData)
        .map(normalizeVideo)
        .filter((i) => !seenIds.current.has(String(i.id)));
      const moreShorts = getArray(moreShortData)
        .map(normalizeShort)
        .filter((i) => !seenIds.current.has(String(i.id)));

      mark(rec);
      mark(tren);
      mark(lat);
      mark(shorts);
      mark(topS);
      mark(moreRec);
      mark(moreTren);
      mark(moreLat);
      mark(moreShorts);

      setRecommended(rec);
      setTrending(tren);
      setLatest(lat);
      setTrendingShorts(shorts);
      setSubscriptions(subs);
      setTopShorts(topS);
      setMoreRecommended(moreRec);
      setMoreTrending(moreTren);
      setMoreLatest(moreLat);
      setMoreTrendingShorts(moreShorts);
    } catch (e) {
      console.warn(e);
      Toast.show({ type: "error", text1: "Failed to load feed" });
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    let active = true;
    let socket: any;
    let handler: any;

    getViewSocket().then((s) => {
      if (!active || !s) return;
      socket = s;
      handler = ({ videoId, views }: any) => {
        const upd = (list: any[]) =>
          list.map((i) =>
            String(i.id) === String(videoId) ? { ...i, views } : i
          );
        setRecommended(upd);
        setTrending(upd);
        setLatest(upd);
        setMoreRecommended(upd);
        setMoreTrending(upd);
        setMoreLatest(upd);
        setTrendingShorts((p) => upd(p));
        setTopShorts((p) => upd(p));
        setMoreTrendingShorts((p) => upd(p));
      };
      socket.on("view-count-updated", handler);
    });

    return () => {
      active = false;
      if (socket && handler) socket.off("view-count-updated", handler);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setActiveVideoId(null);
    await loadAll();
    setRefreshing(false);
  };

  const handleItemClick = useCallback(
    (item: any) => {
      setActiveVideoId(null);
      if (item?.isChannel) {
        navigation.navigate("SubscribedChannels", { id: item.id });
        return;
      }
      if (isShort(item)) {
        navigation.navigate("MainTabs", {
          screen: "Shorts",
          params: { video: item },
        });
        return;
      }
      navigation.navigate("VideoDetail", { id: item.id, item, video: item });
    },
    [navigation]
  );

  const handleSectionPress = useCallback(
    (type: string) => {
      navigation.navigate("ViewAll", { type });
    },
    [navigation]
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 250,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      const most = viewableItems.reduce((a: any, b: any) =>
        (b?.percentVisible ?? 0) > (a?.percentVisible ?? 0) ? b : a
      );
      const item = most?.item;
      if (item?.id && !isShort(item) && item.videoUrl) {
        setActiveVideoId(item.id);
      } else {
        setActiveVideoId(null);
      }
    } else {
      setActiveVideoId(null);
    }
  }).current;

  // ====================== List Data ======================
  const listData = useMemo(() => {
    if (loading) return [{ id: "loading", type: "loading" }];

    const sections = [
      { id: "recommended", title: "Recommended for you", type: "recommended", data: recommended, isShorts: false },
      { id: "trending", title: "Trending Videos", type: "trending", data: trending, isShorts: false },
      { id: "latest", title: "Latest Videos", type: "latest", data: latest, isShorts: false },
      { id: "trending-shorts", title: "Trending Shorts", type: "shorts", data: trendingShorts, isShorts: true },
      { id: "subscriptions", title: "From your Subscriptions", type: "subscriptions", data: subscriptions, isShorts: false },
      { id: "top-shorts", title: "Top Shorts", type: "shorts", data: topShorts, isShorts: true },
      { id: "more-recommended", title: "Recommended for you", type: "recommended", data: moreRecommended, isShorts: false },
      { id: "more-trending", title: "Trending Videos", type: "trending", data: moreTrending, isShorts: false },
      { id: "more-latest", title: "Latest Videos", type: "latest", data: moreLatest, isShorts: false },
      { id: "more-trending-shorts", title: "Trending Shorts", type: "shorts", data: moreTrendingShorts, isShorts: true },
    ];

    return sections.flatMap((section) => {
      if (!section.data || section.data.length === 0) return [];

      const header = {
        id: `${section.id}-header`,
        type: "section-header",
        title: section.title,
        sectionType: section.type,
      };

      if (section.isShorts) {
        // Shorts → grid row
        return [
          header,
          {
            id: `${section.id}-grid`,
            type: "shorts-grid",
            data: section.data,
          },
        ];
      }

      // Normal videos
      return [
        header,
        ...section.data.map((item) => ({
          ...item,
          type: "video",
          rowKey: `${section.id}:${String(item.id)}`,
        })),
      ];
    });
  }, [
    loading,
    recommended,
    trending,
    latest,
    trendingShorts,
    subscriptions,
    topShorts,
    moreRecommended,
    moreTrending,
    moreLatest,
    moreTrendingShorts,
  ]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === "loading") {
        return <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />;
      }

      if (item.type === "section-header") {
        return (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => handleSectionPress(item.sectionType)}
            >
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <ChevronRight size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        );
      }

      // ===== Shorts Grid =====
      if (item.type === "shorts-grid") {
        return (
          <View style={styles.shortsGrid}>
            {item.data.map((short: any) => (
              <ShortCard
                key={short.id}
                item={short}
                onPress={handleItemClick}
              />
            ))}
          </View>
        );
      }

      // ===== Normal Video =====
      return (
        <VideoFeedRow
          item={item}
          isActive={isFocused && activeVideoId === item.id && !!item.videoUrl}
          onPress={handleItemClick}
        />
      );
    },
    [activeVideoId, handleItemClick, handleSectionPress, isFocused]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Navbar onMenuPress={() => {}} points={0} />

      <TopicChips
        onTopicChange={(_, categoryId) =>
          setSelectedCategoryId(categoryId || null)
        }
      />

      <FlatList
        data={listData}
        keyExtractor={(item) => item.rowKey || item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={["#fff"]}
          />
        }
      />
    </View>
  );
}

// ====================== Styles ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  listContent: {
    paddingBottom: 80,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
    marginTop: 16,
    gap: 6,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  // ===== Normal Video Card =====
  card: {
    marginBottom: 18,
  },
  thumbWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#111",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#f00",
  },
  mutedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mutedText: {
    color: "#fff",
    fontSize: 13,
  },
  infoRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textCol: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 3,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelName: {
    color: "#aaa",
    fontSize: 13,
  },
  meta: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 2,
  },

  // ===== Shorts Grid =====
  shortsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: SHORT_GAP,
    marginBottom: 20,
  },
  shortCard: {
    width: SHORT_WIDTH,
  },
  shortThumbWrapper: {
    width: SHORT_WIDTH,
    height: SHORT_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#18181b",
  },
  shortThumb: {
    width: "100%",
    height: "100%",
  },
  shortOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  shortTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  shortViews: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 4,
  },
});