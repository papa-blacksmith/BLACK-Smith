export const ORE_INVENTORY_SIZE = 64;
export const ORE_STACK_LIMIT = 10;

export const ORE_RARITIES = {
  "COMMON": {
    "label": "コモン",
    "icon": "⬜",
    "color": "#c9ced6",
    "description": "最も入手しやすい一般的な鉱石や岩石。"
  },
  "UNCOMMON": {
    "label": "アンコモン",
    "icon": "🟩",
    "color": "#55d68b",
    "description": "少し価値が高く、特定の地域でまとまって採れる鉱物。"
  },
  "RARE": {
    "label": "レア",
    "icon": "🟦",
    "color": "#65a9ff",
    "description": "実用的なファンタジー鉱石や一般的な宝石類。"
  },
  "EPIC": {
    "label": "エピック",
    "icon": "🟪",
    "color": "#b689ff",
    "description": "非常に希少で強力な金属・高級希少石。"
  },
  "LEGENDARY": {
    "label": "レジェンダリー",
    "icon": "🟧",
    "color": "#ffad55",
    "description": "神話級の架空金属や最高級宝石。"
  },
  "MYTHIC": {
    "label": "ミシック",
    "icon": "🔮",
    "color": "#f06cff",
    "description": "世界に一つしか存在しない究極物質・超絶希少石。"
  }
};

const ORE_LIST = [
  {
    "id": "common_001",
    "name": "岩塩",
    "rarity": "COMMON",
    "color": "#c9ced6",
    "icon": "⬜"
  },
  {
    "id": "common_002",
    "name": "鉄",
    "rarity": "COMMON",
    "color": "#c9ced6",
    "icon": "⬜"
  },
  {
    "id": "common_003",
    "name": "銅",
    "rarity": "COMMON",
    "color": "#c9ced6",
    "icon": "⬜"
  },
  {
    "id": "common_004",
    "name": "石英",
    "rarity": "COMMON",
    "color": "#c9ced6",
    "icon": "⬜"
  },
  {
    "id": "common_005",
    "name": "滑らかな石",
    "rarity": "COMMON",
    "color": "#c9ced6",
    "icon": "⬜"
  },
  {
    "id": "uncommon_001",
    "name": "金",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_002",
    "name": "銀",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_003",
    "name": "氷結晶",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_004",
    "name": "マグネサイト",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_005",
    "name": "マグネタイト",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_006",
    "name": "フローライト",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_007",
    "name": "カルサイト",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_008",
    "name": "フォスフォレッセンス",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_009",
    "name": "マカライト鉱石",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_010",
    "name": "バライト",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_011",
    "name": "黒曜石",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "uncommon_012",
    "name": "サンドストーン",
    "rarity": "UNCOMMON",
    "color": "#55d68b",
    "icon": "🟩"
  },
  {
    "id": "rare_001",
    "name": "アズライト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_002",
    "name": "アナテース",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_003",
    "name": "アポフィライト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_004",
    "name": "アラゴナイト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_005",
    "name": "キャシテライト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_006",
    "name": "キュープライト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_007",
    "name": "シナバー",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_008",
    "name": "シリマナイト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_009",
    "name": "シーライト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_010",
    "name": "ジンカイト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_011",
    "name": "スミソナイト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_012",
    "name": "スファレライト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_013",
    "name": "サニディン",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_014",
    "name": "セルサイト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_015",
    "name": "コールマナイト",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_016",
    "name": "ラピスラズリ",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_017",
    "name": "サンストーン",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_018",
    "name": "ブラッドストーン",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_019",
    "name": "オパール",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_020",
    "name": "紅蓮石",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_021",
    "name": "ヘビーメタル",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_022",
    "name": "ブルーメタル",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_023",
    "name": "ライトクリスタル",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_024",
    "name": "ドラグライト鉱石",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_025",
    "name": "カブレライト鉱石",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_026",
    "name": "グラシスメタル",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "rare_027",
    "name": "ユニオン鉱石",
    "rarity": "RARE",
    "color": "#65a9ff",
    "icon": "🟦"
  },
  {
    "id": "epic_001",
    "name": "ミスリル",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_002",
    "name": "オリハルコン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_003",
    "name": "マデュライト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_004",
    "name": "デプスライト鉱石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_005",
    "name": "シーブライト鉱石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_006",
    "name": "アイシスメタル",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_007",
    "name": "エルトライト鉱石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_008",
    "name": "メランジェ鉱石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_009",
    "name": "アンモナイト鉱石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_010",
    "name": "パルサント鉱石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_011",
    "name": "マネマネ銀",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_012",
    "name": "ミスリル銀",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_013",
    "name": "スラハルコン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_014",
    "name": "ピュアクリスタル",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_015",
    "name": "獄炎石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_016",
    "name": "新紅蓮石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_017",
    "name": "ノヴァクリスタル",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_018",
    "name": "魔晶石",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_019",
    "name": "ウォーターストーン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_020",
    "name": "ファイヤーストーン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_021",
    "name": "ウィンドストーン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_022",
    "name": "ライトニングストーン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_023",
    "name": "ホーリーストーン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_024",
    "name": "タンザナイト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_025",
    "name": "アウイナイト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_026",
    "name": "デマントイドガーネット",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_027",
    "name": "バイカラートルマリン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_028",
    "name": "インディゴライト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_029",
    "name": "ジェムシリカ",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_030",
    "name": "モルダバイト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_031",
    "name": "リビアングラス",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_032",
    "name": "ラタナキリブルージルコン",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_033",
    "name": "ダイオプテーズ",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_034",
    "name": "ダトーライト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_035",
    "name": "ツグツパイト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_036",
    "name": "デュモルチェライト単結晶",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_037",
    "name": "ナトロライト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "epic_038",
    "name": "ヘミモルファイト",
    "rarity": "EPIC",
    "color": "#b689ff",
    "icon": "🟪"
  },
  {
    "id": "legendary_001",
    "name": "アダマンタイト",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_002",
    "name": "ヒヒイロカネ",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_003",
    "name": "パルメタル",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_004",
    "name": "虹色鉱石",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_005",
    "name": "アストルニウム",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_006",
    "name": "オリハルコン合金",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_007",
    "name": "オリハルコンプラチナ",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_008",
    "name": "月光石",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_009",
    "name": "精霊銀",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_010",
    "name": "ゾディアック鉱石",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_011",
    "name": "超合金",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_012",
    "name": "超硬質スチール",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_013",
    "name": "超硬質スチール合金",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_014",
    "name": "ダークネスタール",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_015",
    "name": "アレキサンドライト",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_016",
    "name": "パライバトルマリン",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_017",
    "name": "パパラチャサファイア",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_018",
    "name": "グランディディエライト",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_019",
    "name": "ベニトアイト",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_020",
    "name": "レッドベリル",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_021",
    "name": "ノンオイルエメラルド",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_022",
    "name": "ピジョンブラットルビー",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_023",
    "name": "コーンフラワーブルーサファイア",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_024",
    "name": "コバルトスピネル",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_025",
    "name": "カメレオンダイアモンド",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_026",
    "name": "グリーンダイアモンド",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_027",
    "name": "ピンクベニトアイト",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "legendary_028",
    "name": "ベキリーブルーガーネット",
    "rarity": "LEGENDARY",
    "color": "#ffad55",
    "icon": "🟧"
  },
  {
    "id": "mythic_001",
    "name": "賢者の石",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_002",
    "name": "中性子金属",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_003",
    "name": "ダイヤモンド・ファイバー",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_004",
    "name": "超硬質ダイヤモンド・ファイバー",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_005",
    "name": "ペイナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_006",
    "name": "マスグラバイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_007",
    "name": "ターフェアイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_008",
    "name": "セレンディバイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_009",
    "name": "ユークレース",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_010",
    "name": "フォスフォフィライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_011",
    "name": "ジェレメジェバイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_012",
    "name": "ローレントーマサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_013",
    "name": "北海道石",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_014",
    "name": "ポルサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_015",
    "name": "ボレアイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_016",
    "name": "ポートレッタイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_017",
    "name": "マイクロライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_018",
    "name": "ユーディアライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_019",
    "name": "ラズライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_020",
    "name": "リチオフィライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_021",
    "name": "リバースカラーチェンジジルコン",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_022",
    "name": "ゴールデンアイオライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_023",
    "name": "コンドロダイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_024",
    "name": "ショータイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_025",
    "name": "シンハライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_026",
    "name": "スターペリドット",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_027",
    "name": "スティビオタンタライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_028",
    "name": "ストロンチアナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_029",
    "name": "スピネル式双晶",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_030",
    "name": "スフェーン",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_031",
    "name": "ヴェイリネライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_032",
    "name": "ウルツァイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_033",
    "name": "ウルフェナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_034",
    "name": "エオスフォライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_035",
    "name": "エカナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_036",
    "name": "パーガサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_037",
    "name": "エピスティルバイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_038",
    "name": "オージェライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_039",
    "name": "オレンジゾイサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_040",
    "name": "ガスペイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_041",
    "name": "カタプレイアイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_042",
    "name": "カバンサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_043",
    "name": "グリーンスファレライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_044",
    "name": "クリノヒューマイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_045",
    "name": "ローディザイトロンドナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_046",
    "name": "リューサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_047",
    "name": "レインボーラティスサンストーン",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_048",
    "name": "ウィレマイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_049",
    "name": "アングレサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_050",
    "name": "アントヒルガーネット",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_051",
    "name": "アンブリゴナイトモンテブラサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_052",
    "name": "イエローダイオプサイド",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_053",
    "name": "アホイトインクォーツ",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_054",
    "name": "ブラソバイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_055",
    "name": "ベリロナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_056",
    "name": "ヘルデライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_057",
    "name": "マンガノコロンバイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_058",
    "name": "マンガノタンタライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_059",
    "name": "マンガンアキシナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_060",
    "name": "メライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_061",
    "name": "マグネシオアキシライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_062",
    "name": "ピンクエルバイトトルマリン",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_063",
    "name": "ピンクグロッシュラーガーネット",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_064",
    "name": "ピンクスギライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_065",
    "name": "ピンクゾイサイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_066",
    "name": "フォスゲナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_067",
    "name": "フォルステライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_068",
    "name": "バイアナイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_069",
    "name": "パウエライト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_070",
    "name": "バスタマイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_071",
    "name": "バーバンカイト",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_072",
    "name": "ドラゴンガーネット",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  },
  {
    "id": "mythic_073",
    "name": "ハイアロフェン",
    "rarity": "MYTHIC",
    "color": "#f06cff",
    "icon": "🔮"
  }
];

export const ORE_DEFINITIONS = Object.fromEntries(
  ORE_LIST.map((ore) => [ore.id, ore])
);

export const ORE_CATALOG = ORE_LIST;

function makeEmptySlots() {
  return Array.from({ length: ORE_INVENTORY_SIZE }, () => null);
}

export class OreInventorySystem {
  constructor(initialSlots = null) {
    this.slots = this.normalizeSlots(initialSlots);
  }

  normalizeSlots(input) {
    const slots = makeEmptySlots();

    if (!Array.isArray(input)) return slots;

    input.slice(0, ORE_INVENTORY_SIZE).forEach((slot, index) => {
      if (!slot?.oreId || !ORE_DEFINITIONS[slot.oreId]) return;

      const amount = Math.max(
        1,
        Math.min(ORE_STACK_LIMIT, Number(slot.amount) || 1)
      );

      slots[index] = {
        oreId: String(slot.oreId),
        amount
      };
    });

    return slots;
  }

  addOre(oreId, amount = 1) {
    if (!ORE_DEFINITIONS[oreId]) {
      return { added: 0, overflow: Math.max(0, Number(amount) || 0) };
    }

    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    if (!remaining) return { added: 0, overflow: 0 };

    const requested = remaining;

    for (let index = 0; index < this.slots.length && remaining > 0; index += 1) {
      const slot = this.slots[index];

      if (!slot || slot.oreId !== oreId || slot.amount >= ORE_STACK_LIMIT) {
        continue;
      }

      const capacity = ORE_STACK_LIMIT - slot.amount;
      const moved = Math.min(capacity, remaining);

      slot.amount += moved;
      remaining -= moved;
    }

    for (let index = 0; index < this.slots.length && remaining > 0; index += 1) {
      if (this.slots[index]) continue;

      const moved = Math.min(ORE_STACK_LIMIT, remaining);
      this.slots[index] = { oreId, amount: moved };
      remaining -= moved;
    }

    return {
      added: requested - remaining,
      overflow: remaining
    };
  }

  removeOre(oreId, amount = 1) {
    let remaining = Math.max(0, Math.floor(Number(amount) || 0));
    if (!remaining) return 0;

    const requested = remaining;

    for (
      let index = this.slots.length - 1;
      index >= 0 && remaining > 0;
      index -= 1
    ) {
      const slot = this.slots[index];
      if (!slot || slot.oreId !== oreId) continue;

      const removed = Math.min(slot.amount, remaining);
      slot.amount -= removed;
      remaining -= removed;

      if (slot.amount <= 0) {
        this.slots[index] = null;
      }
    }

    return requested - remaining;
  }

  countOre(oreId) {
    return this.slots.reduce(
      (total, slot) =>
        total + (slot?.oreId === oreId ? slot.amount : 0),
      0
    );
  }

  getUsedSlotCount() {
    return this.slots.filter(Boolean).length;
  }

  getFreeSlotCount() {
    return ORE_INVENTORY_SIZE - this.getUsedSlotCount();
  }

  canAdd(oreId, amount = 1) {
    const clone = new OreInventorySystem(this.toJSON());
    return clone.addOre(oreId, amount).overflow === 0;
  }

  clearSlot(index) {
    if (index < 0 || index >= ORE_INVENTORY_SIZE) return false;
    this.slots[index] = null;
    return true;
  }

  toJSON() {
    return this.slots.map((slot) =>
      slot ? { oreId: slot.oreId, amount: slot.amount } : null
    );
  }
}
