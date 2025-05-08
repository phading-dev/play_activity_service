import { BIGTABLE } from "../../common/bigtable_client";
import { Table } from "@google-cloud/bigtable";

export class WatchedVideoTimeTable {
  public static create(): WatchedVideoTimeTable {
    return new WatchedVideoTimeTable(BIGTABLE);
  }

  private static TABLE_PREFIX = "w";
  private static COLUMN_FAMILY = "w";
  private static COLUMN_QUALIFIER = "t";

  public constructor(private bigtable: Table) {}

  public async set(
    watcherId: string,
    watchSessionId: string,
    watchedVideoTimeMs: number,
  ): Promise<void> {
    await this.bigtable.insert([
      {
        key: `${WatchedVideoTimeTable.TABLE_PREFIX}#${watcherId}#${watchSessionId}`,
        data: {
          [WatchedVideoTimeTable.COLUMN_FAMILY]: {
            [WatchedVideoTimeTable.COLUMN_QUALIFIER]: {
              value: watchedVideoTimeMs,
            },
          },
        },
      },
    ]);
  }

  public async getMs(
    watcherId: string,
    watchSessionId: string,
  ): Promise<number> {
    let [rows] = await this.bigtable.getRows({
      keys: [
        `${WatchedVideoTimeTable.TABLE_PREFIX}#${watcherId}#${watchSessionId}`,
      ],
      filter: {
        column: {
          cellLimit: 1,
        },
      },
    });
    if (rows.length === 0) {
      return 0;
    } else {
      let row = rows[0];
      return row.data[WatchedVideoTimeTable.COLUMN_FAMILY][
        WatchedVideoTimeTable.COLUMN_QUALIFIER
      ][0].value;
    }
  }
}

export let WATCHED_VIDEO_TIME_TABLE = WatchedVideoTimeTable.create();
