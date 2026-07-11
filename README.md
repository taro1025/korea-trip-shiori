# 韓国男旅のしおり

2026年7月16日（木）から7月20日（月）までの韓国旅行しおりです。
宿はAirbnb「Home in Seoul」（ホストJeff）、麻浦区 서강로13길 13（13 Seogang-ro 13-gil, Mapo-gu, Seoul 04061）で、弘大入口駅を移動の基準にしています。チェックインは7/16 16:00、チェックアウトは7/20 11:00です。
DMZツアーは7/18（土）予約済みで、朝7:30に弘大集合、現地でパスポート確認があります。

## 内容

- 4泊5日の予定を1日ずつ表示
- 日程を先頭に表示し、日別タブは横スクロールで1段表示
- フライト実時刻を除き、15分単位の余裕あるタイムライン
- 移動時間を含めた予定
- 各場所・移動のNaver Mapリンク
- Naver Mapアプリで開く、現在地に依存しない1日分の経路リンク
- Naver Mapの経由地上限に合わせた分割経路リンク
- 日別の経路リンクは折りたたみで表示
- 髪を切りたい2人（うち1人は施術する人）は7月16日の夜に弘大で術前に散髪
- 7月17日は施術しない2人を主軸に表示し、施術する人の09:00〜13:00プロミス整形外科スケジュールを下部に表示
- 到着便・宿・施術内容など未確定情報のTODO表示欄を情報タブで表示
- 入国、緊急連絡、DMZ、7月気候、地図、施術の現地メモを情報タブで表示
- 未消化Todoリスト、行きたいこと、持ち物、事前予約チェックを情報タブで表示
- フィリピン国籍向けのビザ注意と、到着3日前から提出できるe-Arrival Cardの公式URLを持ち物に表示
- 画面下部に「今日の経路」「旅の情報」「ワリカ」への固定メニューを表示
- 7月16日 成田12:30発/仁川15:10着、7月20日 仁川07:25発/成田09:50着を反映
- 画像案を基に、7月17日を美容・聖水・漢江、7月18日をDMZ・カジノ、7月19日を広蔵市場・明洞・Nソウルタワーとして構成
- 概要タブに割り勘サービス「ワリカ」への外部リンク（別タブで開く）を設置
- 当日（7/16〜20）は該当日のタブを自動表示し、現在時刻の予定を「今ここ」で強調、上部に今／次バーを表示
- タイムラインを移動・食事・施術・ケア・宿・観光でアイコンと色分け
- 現地メモに緊急連絡先（112/119/1339/1330）をタップ発信できるチップを設置
- 宿の住所コピーとNaverで開くボタンを概要タブに設置
- 持ち物・事前準備はタップでチェックでき、localStorageに保存
- 画面下部に「今日の経路／割り勘／緊急」の固定クイックバーを常時表示
- 端末設定に追従し、ボタンでも切り替えられるダークモードに対応
- 韓国旅行イラストのfaviconとApple Touch Iconを設定

## ローカル確認

```bash
npm test
python3 -m http.server 4173
```

ブラウザで `http://localhost:4173` を開きます。

## 編集する場所

日程、場所、TODO、Naver Mapの起点・目的地は `assets/itinerary.js` の `window.TRIP_DATA` を編集します。
Naver Map経路は公式URLスキーム `nmap://route/...` と `places` の緯度経度を使い、現在地が日本でも現在地起点にはしません。
AndroidではNaver Mapアプリを開きやすい `intent://` 形式に自動変換します。
1日分の経路は、Naver Mapの経由地上限に合わせて必要に応じて分割します。

未確定情報は `keyFacts` に `TODO` として表示しています。
未消化Todoは `openTodos` を編集してください。
旅行前チェックは `todoList`、持ち物は `checkList`、現地注意点は `guideMemos` を編集します。
表示上は `index.html` の `infoTabs` 配下にタブとしてまとめています。
faviconは `assets/icons/` 配下のPNGを `index.html` のheadで参照しています。

フライトの便名・ターミナル、宿の正確な住所、施術内容が確定したら、以下を更新してください。

- `base`
- `keyFacts`
- `openTodos`
- 7月16日の到着便名、仁川空港ターミナル
- 7月17日のクリニック予約番号、施術内容、術後連絡先
- 7月20日の帰国便名、仁川空港ターミナル、早朝移動手段

## 公開

`main` ブランチへpushすると、GitHub ActionsでGitHub Pagesへ公開されます。

公開予定URL:

https://taro1025.github.io/korea-trip-shiori/

## 参考情報

- 山清炭火ガーデン: https://www.catchtable.net/ja-JP/shop/sancheongstar
- プロミス整形外科: https://jp.promiseps.co.kr/
- 広蔵市場: https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=106345
- Paradise Casino Walkerhill: https://www.paradisecasino.co.kr/
- 楊花漢江公園: https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=91221
- Nソウルタワー: https://www.nseoultower.co.kr/eng/
- K-ETA免除延長: https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=251923
- e-Arrival Card: https://www.e-arrivalcard.go.kr/
- 韓国緊急連絡先: https://english.visitkorea.or.kr/svc/faq/faqMainView.do?menuSn=404&pstSn=94
- 仁川空港出発案内: https://www.airport.kr/ap_en/6636/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGYXBfZW4lMkY5MzclMkYxMzgxOTglMkZhcnRjbFZpZXcuZG8lM0Y%3D
- ソウルの気候: https://english.seoul.go.kr/seoul-views/meaning-of-seoul/3-climate/
- DMZツアー注意点: https://www.timetravelturtle.com/south-korea/dmz-tour-from-seoul/
- Naver Maps URL Scheme: https://guide.ncloud-docs.com/docs/en/maps-url-scheme
- 画像: https://unsplash.com/s/photos/gangnam
