var DELAY = 0.1;
var savingFolderId = 'SY7AkDMjYZ7V';    // 退避先のフォルダID
var monthAgo = 2;                       // 退避対象ブックマークを2ヶ月未読のものと決めうちで確認

// ブックマーク走査
class BookmarkTracer {
  constructor()
  {
    this.name = 'ExtendBookmarks';
  }

  // ブックマークツリーを走査
  traceTree(bookmarkItems)
  {
    this.traceItems(bookmarkItems[0], 0);
  };

  // ブックマークアイテムを走査
  traceItems(bookmarkItem, indent)
  {
    return new Promise((resolve, reject) => {
      if (bookmarkItem.title != '') {
        var searching = browser.history.search(this.createLogSearchCriteria(bookmarkItem));
        searching.then(this.haveGot)
        .then(function(lastVisitTime) {
          bookmarkItem.lastVisitTime = lastVisitTime;
          resolve(bookmarkItem);
        });
      }

      if (bookmarkItem.children) {
        if (bookmarkItem.title) indent++;
        for (let childlen of bookmarkItem.children) {
          this.traceItems(childlen, indent);
        }
        indent--;
      }
    }).then((bookmarkItem) => {
      if (this.isMoveTarget(bookmarkItem)) {
        var movingBookmark = browser.bookmarks.move(bookmarkItem.id, {parentId: savingFolderId})
      }
      this.displayLog(bookmarkItem, indent);
    });
  };

  // 履歴検索条件の生成
  // URLを持っている場合はURLを条件、持っていない場合はタイトルを条件とする
  createLogSearchCriteria(bookmarkItem)
  {
    var domainName = bookmarkItem.url == undefined
                   ? bookmarkItem.title
                   : bookmarkItem.url.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/i)[4];
    return {
      text: domainName,
      startTime: 0
    };
  }

  // 履歴の取得
  haveGot(historyItems)
  {
    for (let item of historyItems) {
      return new Date(item.lastVisitTime);
    }
  }

  // 移動対象か
  isMoveTarget(bookmarkItem)
  {
    var dt = new Date();
    dt.setMonth(dt.getMonth() - monthAgo);
    return (bookmarkItem.type != "folder" && dt > bookmarkItem.lastVisitTime) ? true : false;
  }

  // ログを表示
  displayLog(bookmarkItem, indent)
  {
    if (bookmarkItem.title != '') {
      if (bookmarkItem.lastVisitTime == undefined) {
        console.log(this.appendIndent(indent) + ">" + bookmarkItem.title);
      } else {
        console.log(this.appendIndent(indent) + ">" + bookmarkItem.title + " " + bookmarkItem.lastVisitTime + " " + bookmarkItem.id);
      }
    }
  }

  // インデントを追加
  appendIndent(indentLength)
  {
    return " ".repeat(indentLength);
  }
}

createAlarm();

// アラーム生成
function createAlarm()
{
  console.log("createAlarm");
  browser.alarms.clearAll();
  browser.alarms.create("", {delayInMinutes: DELAY})
}

// アラーム動作
browser.alarms.onAlarm.addListener((alarm) => {
  console.log('onAlarms');

  let bookmarkTracer = new BookmarkTracer();
  browser.bookmarks.getTree(bookmarkTracer.traceTree.bind(bookmarkTracer));
});
