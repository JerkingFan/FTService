export type RootStackParamList = {
  Tabs: undefined;
  PartDetail: { id: number };
  Booking: { masterId: number; masterName: string };
  Masters: undefined;
  Messages: undefined;
  Parts: { q?: string; part_number?: string; openFilters?: boolean; category?: string } | undefined;
  Login: undefined;
  Register: undefined;
  SubmitPart: undefined;
};

export type TabParamList = {
  Home: undefined;
  Favorites: undefined;
  Add: undefined;
  Chat: undefined;
  Profile: undefined;
};
