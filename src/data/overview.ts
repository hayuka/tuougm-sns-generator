export interface PlannedPost {
  id: string;
  at: string;
  title: string;
  platform: 'Instagram' | 'Threads' | 'Facebook' | 'X';
  status: '承認済み' | '承認待ち';
}
export interface Activity {
  id: string;
  type: '投稿案作成' | '編集' | '承認' | '予定登録';
  title: string;
  at: string;
}
export interface OverviewData {
  summary: { content: number; drafts: number; review: number; planned: number };
  posts: PlannedPost[];
  activities: Activity[];
}

// Fixed fixtures keep reviews reproducible. Calendar entries are plans, never publishing jobs.
export const overviewByBrand: Record<string, OverviewData> = {
  tuougm: {
    summary: { content: 24, drafts: 12, review: 4, planned: 3 },
    posts: [
      { id: 't1', at: '2026-11-02T19:00:00+09:00', title: '新しい音楽との出会いを、今週も。', platform: 'Instagram', status: '承認済み' },
      { id: 't2', at: '2026-11-04T12:00:00+09:00', title: '制作の裏側から — スタジオノート', platform: 'Threads', status: '承認済み' },
      { id: 't3', at: '2026-11-06T18:30:00+09:00', title: '週末に聴きたいプレイリスト', platform: 'X', status: '承認待ち' },
    ],
    activities: [
      { id: 'ta1', type: '予定登録', title: '新しい音楽との出会いを、今週も。', at: '2026-10-26T14:30:00+09:00' },
      { id: 'ta2', type: '承認', title: '制作の裏側から — スタジオノート', at: '2026-10-26T13:15:00+09:00' },
      { id: 'ta3', type: '編集', title: '週末に聴きたいプレイリスト', at: '2026-10-26T11:20:00+09:00' },
      { id: 'ta4', type: '投稿案作成', title: '11月のリリース情報', at: '2026-10-26T10:00:00+09:00' },
    ],
  },
  re: {
    summary: { content: 8, drafts: 5, review: 2, planned: 1 },
    posts: [
      { id: 'r1', at: '2026-11-03T10:00:00+09:00', title: 'REと見つける、新しい日常', platform: 'Facebook', status: '承認済み' },
    ],
    activities: [
      { id: 'ra1', type: '予定登録', title: 'REと見つける、新しい日常', at: '2026-10-26T15:00:00+09:00' },
      { id: 'ra2', type: '承認', title: 'REと見つける、新しい日常', at: '2026-10-26T14:00:00+09:00' },
      { id: 'ra3', type: '編集', title: '暮らしの小さなアイデア', at: '2026-10-26T12:00:00+09:00' },
      { id: 'ra4', type: '投稿案作成', title: 'REのブランドストーリー', at: '2026-10-26T09:00:00+09:00' },
    ],
  },
};

export function formatDate(at: string, timezone: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: timezone, month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(at));
}
