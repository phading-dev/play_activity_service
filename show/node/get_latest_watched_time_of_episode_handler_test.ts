import "../../local/env";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchedEpisodeStatement,
  insertWatchedEpisodeStatement,
} from "../../db/sql";
import { WATCH_TIME_TABLE } from "../common/watch_time_table";
import { GetLatestWatchedTimeOfEpisodeHandler } from "./get_latest_watched_time_of_episode_handler";
import { GET_LATEST_WATCHED_TIME_OF_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "GetLatestWatchedTimeOfEpisodeHandlerTest",
  cases: [
    {
      name: "GetLastWatchedSessionOfEpisode",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchedEpisodeStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              episodeIndex: 1,
              latestWatchSessionId: "watchSession1",
              updatedTimeMs: 100,
            }),
          ]);
          await transaction.commit();
        });
        await WATCH_TIME_TABLE.set("account1", "watchSession1", 60);
        let handler = new GetLatestWatchedTimeOfEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
        );

        // Execute
        let response = await handler.handle("", {
          watcherId: "account1",
          seasonId: "season1",
          episodeId: "episode1",
        });

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              episodeIndex: 1,
              watchedTimeMs: 60,
            },
            GET_LATEST_WATCHED_TIME_OF_EPISODE_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchedEpisodeStatement("account1", "season1", "episode1"),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "NoEpisodeWatched",
      async execute() {
        // Prepare
        let handler = new GetLatestWatchedTimeOfEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
        );

        // Execute
        let response = await handler.handle("", {
          watcherId: "account1",
          seasonId: "season1",
          episodeId: "episode1",
        });

        // Verify
        assertThat(
          response,
          eqMessage({}, GET_LATEST_WATCHED_TIME_OF_EPISODE_RESPONSE),
          "response",
        );
      },
      async tearDown() {},
    },
  ],
});
