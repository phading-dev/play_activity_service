import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchedSeasonStatement,
  insertWatchedSeasonStatement,
} from "../../db/sql";
import { WatchedVideoTimeRow } from "../common/watched_video_time_row";
import { ListRecentlyWatchedSeasonsHandler } from "./list_recently_watched_seaons_handler";
import { LIST_RECENTLY_WATCHED_SEASONS_RESPONSE } from "@phading/play_activity_service_interface/show/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "ListRecentlyWatchedSeasonsHandlerTest",
  cases: [
    {
      name: "List",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              latestEpisodeId: "episode1",
              latestWatchSessionDate: "2023-10-21",
              updatedTimeMs: 100,
            }),
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season3",
              latestEpisodeId: "episode100",
              latestWatchSessionDate: "2023-10-23",
              updatedTimeMs: 300,
            }),
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season2",
              latestEpisodeId: "episode10",
              latestWatchSessionDate: "2023-10-23",
              updatedTimeMs: 200,
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.insert([
          WatchedVideoTimeRow.setEntry(
            "account1",
            "season1",
            "episode1",
            "2023-10-21",
            60,
          ),
          WatchedVideoTimeRow.setEntry(
            "account1",
            "season2",
            "episode10",
            "2023-10-23",
            120,
          ),
        ]);
        let handler = new ListRecentlyWatchedSeasonsHandler(
          SPANNER_DATABASE,
          BIGTABLE,
          () => 1000,
        );

        // Execute
        let response = await handler.handle("", {
          watcherId: "account1",
          limit: 2,
        });

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              seasons: [
                {
                  seasonId: "season3",
                  latestEpisodeId: "episode100",
                  latestWatchedVideoTimeMs: 0,
                },
                {
                  seasonId: "season2",
                  latestEpisodeId: "episode10",
                  latestWatchedVideoTimeMs: 120,
                },
              ],
            },
            LIST_RECENTLY_WATCHED_SEASONS_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season1",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season2",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season3",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
  ],
});
