import { BIGTABLE } from "../../common/bigtable_client";
import { Table } from "@google-cloud/bigtable";

export class WatchTimeTable {
  public static create(): WatchTimeTable {
    return new WatchTimeTable(BIGTABLE);
  }

  private static TABLE_PREFIX = "w";
  private static COLUMN_FAMILY = "w";
  private static COLUMN_QUALIFIER = "t";

  public constructor(private bigtable: Table) {}

  public async set(
    watcherId: string,
    watchSessionId: string,
    watchTimeMs: number,
  ): Promise<void> {
    await this.bigtable.insert([
      {
        key: `${WatchTimeTable.TABLE_PREFIX}:${watcherId}:${watchSessionId}`,
        data: {
          [WatchTimeTable.COLUMN_FAMILY]: {
            [WatchTimeTable.COLUMN_QUALIFIER]: {
              value: watchTimeMs,
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
    let [row] = await this.bigtable
      .row(`${WatchTimeTable.TABLE_PREFIX}:${watcherId}:${watchSessionId}`)
      .get({
        filter: {
          column: {
            cellLimit: 1,
          },
        },
      });
    return row.data[WatchTimeTable.COLUMN_FAMILY][
      WatchTimeTable.COLUMN_QUALIFIER
    ][0].value;
  }
}

export let WATCH_TIME_TABLE = WatchTimeTable.create();
