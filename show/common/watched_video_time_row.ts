import { Entry, Table } from "@google-cloud/bigtable";

export class WatchedVideoTimeRow {
  private static ROW_PREFIX = "w";
  private static COLUMN_FAMILY = "w";
  private static COLUMN_QUALIFIER = "t";

  public static setEntry(
    watcherId: string,
    seasonId: string,
    episodeId: string,
    date: string,
    watchedVideoTimeMs: number,
  ): Entry {
    return {
      key: `${WatchedVideoTimeRow.ROW_PREFIX}#${watcherId}#${seasonId}#${episodeId}#${date}`,
      data: {
        [WatchedVideoTimeRow.COLUMN_FAMILY]: {
          [WatchedVideoTimeRow.COLUMN_QUALIFIER]: {
            value: watchedVideoTimeMs,
          },
        },
      },
    };
  }

  public static async getMs(
    bigtable: Table,
    watcherId: string,
    seasonId: string,
    episodeId: string,
    date: string,
  ): Promise<number> {
    let [rows] = await bigtable.getRows({
      keys: [
        `${WatchedVideoTimeRow.ROW_PREFIX}#${watcherId}#${seasonId}#${episodeId}#${date}`,
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
      return row.data[WatchedVideoTimeRow.COLUMN_FAMILY][
        WatchedVideoTimeRow.COLUMN_QUALIFIER
      ][0].value;
    }
  }
}
