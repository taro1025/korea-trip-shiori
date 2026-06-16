# 韓国男旅のしおり

2026年7月16日（木）から7月20日（月）までの韓国旅行しおりです。
宿はソウル特別市 麻浦区 東橋洞周辺を想定し、弘大入口駅を移動の基準にしています。

## 内容

- 4泊5日の予定を1日ずつ表示
- 15分単位の余裕あるタイムライン
- 移動時間を含めた予定
- 各場所・移動のGoogle Mapsリンク
- 現在地に依存しない1日分のGoogle Maps一括経路リンク
- Google Mapsで線が出やすい2地点ずつの補助経路リンク
- 7月19日の日程内に友人2人が動く別行動ルート
- 行きたいことの回収リスト
- 持ち物と事前予約チェック

## ローカル確認

```bash
npm test
python3 -m http.server 4173
```

ブラウザで `http://localhost:4173` を開きます。

## 編集する場所

日程、場所、Google Mapsの起点・目的地は `assets/itinerary.js` の `window.TRIP_DATA` を編集します。
1日分の一括経路は、その日の最初の地点を `origin`、最後の地点を `destination`、途中地点を `waypoints` にして開きます。
現在地が日本でも現在地起点にはしません。
Google Maps側の制限により、スマホで経由地が省略される場合は2地点ずつの補助経路リンクを使います。

フライト時刻、施術クリニック、宿の正確な住所が確定したら、以下を更新してください。

- `base`
- 7月16日の到着時刻
- 7月19日のクリニック目的地
- 7月20日の空港到着目標

## 公開

`main` ブランチへpushすると、GitHub ActionsでGitHub Pagesへ公開されます。

公開予定URL:

https://taro1025.github.io/korea-trip-shiori/

## 参考情報

- 山清炭火ガーデン: https://www.catchtable.net/ja-JP/shop/sancheongstar
- 広蔵市場: https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=106345
- Paradise Casino Walkerhill: https://www.paradisecasino.co.kr/
- 楊花漢江公園: https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=91221
- Nソウルタワー: https://www.nseoultower.co.kr/eng/
- DMZツアー注意点: https://www.timetravelturtle.com/south-korea/dmz-tour-from-seoul/
- Google Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
- 画像: https://unsplash.com/s/photos/gangnam
