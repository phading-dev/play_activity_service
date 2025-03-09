import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchedSeasonStatement,
  insertWatchedSeasonStatement,
} from "../../db/sql";
import { WATCH_TIME_TABLE } from "../common/watch_time_table";
import { GetLatestWatchedEpisodeHandler } from "./get_latest_watched_episode_handler";
import { GET_LATEST_WATCHED_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "GetLatestWatchedEpisodeHandlerTest",
  cases: [
    {
      name: "GetLastWatchedEpisodeOfSeason",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              latestEpisodeId: "episode1",
              latestWatchSessionId: "watchSession1",
              latestEpisodeIndex: 1,
              updatedTimeMs: 1000,
            }),
          ]);
          await transaction.commit();
        });
        await WATCH_TIME_TABLE.set("account1", "watchSession1", 60);
        let handler = new GetLatestWatchedEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
        );

        // Execute
        let response = await handler.handle("", {
          seasonId: "season1",
          watcherId: "account1",
        });

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              episodeId: "episode1",
              episodeIndex: 1,
              watchedTimeMs: 60,
            },
            GET_LATEST_WATCHED_EPISODE_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchedSeasonStatement("account1", "season1"),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
    {
      name: "NoEpisodeWatched",
      async execute() {
        // Prepare
        let handler = new GetLatestWatchedEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
        );

        // Execute
        let response = await handler.handle("", {
          seasonId: "season1",
          watcherId: "account1",
        });

        // Verify
        assertThat(
          response,
          eqMessage({}, GET_LATEST_WATCHED_EPISODE_RESPONSE),
          "response",
        );
      },
      async tearDown() {},
    },
  ],
});
