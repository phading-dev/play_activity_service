import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  deleteWatchedEpisodeStatement,
  insertWatchedEpisodeStatement,
} from "../../db/sql";
import { WATCHED_VIDEO_TIME_TABLE } from "../common/watched_video_time_table";
import { GetLatestWatchedVideoTimeOfEpisodeHandler } from "./get_latest_watched_video_time_of_episode_handler";
import { GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "GetLatestWatchedVideoTimeOfEpisodeHandlerTest",
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
              latestWatchSessionId: "watchSession1",
            }),
          ]);
          await transaction.commit();
        });
        await WATCHED_VIDEO_TIME_TABLE.set("account1", "watchSession1", 60);
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new GetLatestWatchedVideoTimeOfEpisodeHandler(
          SPANNER_DATABASE,
          WATCHED_VIDEO_TIME_TABLE,
          serviceClientMock,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              watchedVideoTimeMs: 60,
            },
            GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchedEpisodeStatement({
              watchedEpisodeWatcherIdEq: "account1",
              watchedEpisodeSeasonIdEq: "season1",
              watchedEpisodeEpisodeIdEq: "episode1",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
    {
      name: "NoWatchTime",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchedEpisodeStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              latestWatchSessionId: "watchSession1",
            }),
          ]);
          await transaction.commit();
        });
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new GetLatestWatchedVideoTimeOfEpisodeHandler(
          SPANNER_DATABASE,
          WATCHED_VIDEO_TIME_TABLE,
          serviceClientMock,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              watchedVideoTimeMs: 0,
            },
            GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_RESPONSE,
          ),
          "response",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchedEpisodeStatement({
              watchedEpisodeWatcherIdEq: "account1",
              watchedEpisodeSeasonIdEq: "season1",
              watchedEpisodeEpisodeIdEq: "episode1",
            }),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "NoEpisodeWatched",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new GetLatestWatchedVideoTimeOfEpisodeHandler(
          SPANNER_DATABASE,
          WATCHED_VIDEO_TIME_TABLE,
          serviceClientMock,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage({}, GET_LATEST_WATCHED_VIDEO_TIME_OF_EPISODE_RESPONSE),
          "response",
        );
      },
      async tearDown() {},
    },
  ],
});
