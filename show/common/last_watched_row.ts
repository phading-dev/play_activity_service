import { Entry, Table } from "@google-cloud/bigtable";

export class LastWatchedRow {
  private static ROW_PREFIX = "w";
  private static COLUMN_FAMILY = "w";
  private static COLUMN_SEASON_ID = "s";
  private static COLUMN_EPISODE_ID = "e";

  public static setEntry(
    watcherId: string,
    date: string,
    seasonId: string,
    episodeId: string,
  ): Entry {
    return {
      key: `${LastWatchedRow.ROW_PREFIX}#${watcherId}#${date}`,
      data: {
        [LastWatchedRow.COLUMN_FAMILY]: {
          [LastWatchedRow.COLUMN_SEASON_ID]: { value: seasonId },
          [LastWatchedRow.COLUMN_EPISODE_ID]: { value: episodeId },
        },
      },
    };
  }

  public static async get(
    bigtable: Table,
    watcherId: string,
    date: string,
  ): Promise<{ seasonId?: string; episodeId?: string }> {
    let [rows] = await bigtable.getRows({
      keys: [`${LastWatchedRow.ROW_PREFIX}#${watcherId}#${date}`],
      filter: {
        column: {
          cellLimit: 1,
        },
      },
    });
    if (rows.length === 0) {
      return {};
    } else {
      let row = rows[0];
      return {
        seasonId:
          row.data[LastWatchedRow.COLUMN_FAMILY][
            LastWatchedRow.COLUMN_SEASON_ID
          ][0].value,
        episodeId:
          row.data[LastWatchedRow.COLUMN_FAMILY][
            LastWatchedRow.COLUMN_EPISODE_ID
          ][0].value,
      };
    }
  }
}
