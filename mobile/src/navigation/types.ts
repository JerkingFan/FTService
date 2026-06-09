export type RootStackParamList = {
  Tabs: undefined;
  PartDetail: { id: number };
  Booking: { masterId: number; masterName: string };
  Masters: undefined;
  Messages: undefined;
  Parts:
    | {
        q?: string;
        part_number?: string;
        car_fit?: string;
        openFilters?: boolean;
        category?: string;
      }
    | undefined;
  Login: undefined;
  Register: undefined;
  SubmitPart: undefined;
  ChatThread: { conversationId: number; title?: string; peerName?: string };
};

export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Add: undefined;
  Chat: undefined;
  Profile: undefined;
};
