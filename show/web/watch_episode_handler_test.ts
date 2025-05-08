import "../../local/env";
import { BIGTABLE } from "../../common/bigtable_client";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  GET_WATCHED_EPISODE_ROW,
  GET_WATCHED_SEASON_ROW,
  GET_WATCH_SESSION_ROW,
  deleteWatchSessionStatement,
  deleteWatchedEpisodeStatement,
  deleteWatchedSeasonStatement,
  getWatchSession,
  getWatchedEpisode,
  getWatchedSeason,
  insertWatchSessionStatement,
  insertWatchedEpisodeStatement,
  insertWatchedSeasonStatement,
} from "../../db/sql";
import { WATCHED_VIDEO_TIME_TABLE } from "../common/watched_video_time_table";
import { WatchEpisodeHandler } from "./watch_episode_handler";
import { WATCH_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { FetchSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertThat, eq, isArray } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

TEST_RUNNER.run({
  name: "WatchEpisodeHandlerTest",
  cases: [
    {
      name: "NoSessionId_CreateANewSession",
      async execute() {
        // Prepare
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsume: true,
          },
        } as FetchSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          WATCHED_VIDEO_TIME_TABLE,
          serviceClientMock,
          () => "uuid1",
          () => 1000,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
            watchedVideoTimeMs: 60,
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              watchSessionId: "uuid1",
            },
            WATCH_EPISODE_RESPONSE,
          ),
          "response",
        );
        assertThat(
          await WATCHED_VIDEO_TIME_TABLE.getMs("account1", "uuid1"),
          eq(60),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, {
            watchSessionWatcherIdEq: "account1",
            watchSessionWatchSessionIdEq: "uuid1",
          }),
          isArray([
            eqMessage(
              {
                watchSessionWatcherId: "account1",
                watchSessionSeasonId: "season1",
                watchSessionEpisodeId: "episode1",
                watchSessionWatchSessionId: "uuid1",
                watchSessionCreatedTimeMs: 1000,
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, {
            watchedSeasonWatcherIdEq: "account1",
            watchedSeasonSeasonIdEq: "season1",
          }),
          isArray([
            eqMessage(
              {
                watchedSeasonWatcherId: "account1",
                watchedSeasonSeasonId: "season1",
                watchedSeasonLatestEpisodeId: "episode1",
                watchedSeasonLatestWatchSessionId: "uuid1",
                watchedSeasonUpdatedTimeMs: 1000,
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(SPANNER_DATABASE, {
            watchedEpisodeWatcherIdEq: "account1",
            watchedEpisodeSeasonIdEq: "season1",
            watchedEpisodeEpisodeIdEq: "episode1",
          }),
          isArray([
            eqMessage(
              {
                watchedEpisodeWatcherId: "account1",
                watchedEpisodeSeasonId: "season1",
                watchedEpisodeEpisodeId: "episode1",
                watchedEpisodeLatestWatchSessionId: "uuid1",
                watchedEpisodeUpdatedTimeMs: 1000,
              },
              GET_WATCHED_EPISODE_ROW,
            ),
          ]),
          "WatchedEpisode",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionWatchSessionIdEq: "uuid1",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season1",
            }),
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
      name: "UpdateWatchedSeasonAndEpisodeWithNewSession",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchedSeasonStatement({
              watcherId: "account1",
              seasonId: "season1",
              latestEpisodeId: "episode1",
              latestWatchSessionId: "watchSession1",
              updatedTimeMs: 100,
            }),
            insertWatchedEpisodeStatement({
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              latestWatchSessionId: "watchSession1",
              updatedTimeMs: 100,
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
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          WATCHED_VIDEO_TIME_TABLE,
          serviceClientMock,
          () => "uuid1",
          () => 1000,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            seasonId: "season1",
            episodeId: "episode1",
            watchedVideoTimeMs: 60,
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              watchSessionId: "uuid1",
            },
            WATCH_EPISODE_RESPONSE,
          ),
          "response",
        );
        assertThat(
          await WATCHED_VIDEO_TIME_TABLE.getMs("account1", "uuid1"),
          eq(60),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, {
            watchSessionWatcherIdEq: "account1",
            watchSessionWatchSessionIdEq: "uuid1",
          }),
          isArray([
            eqMessage(
              {
                watchSessionWatcherId: "account1",
                watchSessionSeasonId: "season1",
                watchSessionEpisodeId: "episode1",
                watchSessionWatchSessionId: "uuid1",
                watchSessionCreatedTimeMs: 1000,
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, {
            watchedSeasonWatcherIdEq: "account1",
            watchedSeasonSeasonIdEq: "season1",
          }),
          isArray([
            eqMessage(
              {
                watchedSeasonWatcherId: "account1",
                watchedSeasonSeasonId: "season1",
                watchedSeasonLatestEpisodeId: "episode1",
                watchedSeasonLatestWatchSessionId: "uuid1",
                watchedSeasonUpdatedTimeMs: 1000,
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(SPANNER_DATABASE, {
            watchedEpisodeWatcherIdEq: "account1",
            watchedEpisodeSeasonIdEq: "season1",
            watchedEpisodeEpisodeIdEq: "episode1",
          }),
          isArray([
            eqMessage(
              {
                watchedEpisodeWatcherId: "account1",
                watchedEpisodeSeasonId: "season1",
                watchedEpisodeEpisodeId: "episode1",
                watchedEpisodeLatestWatchSessionId: "uuid1",
                watchedEpisodeUpdatedTimeMs: 1000,
              },
              GET_WATCHED_EPISODE_ROW,
            ),
          ]),
          "WatchedEpisode",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionWatchSessionIdEq: "uuid1",
            }),
            deleteWatchedSeasonStatement({
              watchedSeasonWatcherIdEq: "account1",
              watchedSeasonSeasonIdEq: "season1",
            }),
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
      name: "UpdateWatchTimeOnExistingSession",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchSessionStatement({
              watcherId: "account1",
              watchSessionId: "watchSession1",
              seasonId: "season1",
              episodeId: "episode1",
              createdTimeMs: 100,
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
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          WATCHED_VIDEO_TIME_TABLE,
          serviceClientMock,
          () => "uuid1",
          () => 1000,
        );

        // Execute
        let response = await handler.handle(
          "",
          {
            watchSessionId: "watchSession1",
            seasonId: "season1",
            episodeId: "episode1",
            watchedVideoTimeMs: 120,
          },
          "session1",
        );

        // Verify
        assertThat(
          response,
          eqMessage(
            {
              watchSessionId: "watchSession1",
            },
            WATCH_EPISODE_RESPONSE,
          ),
          "response",
        );
        assertThat(
          await WATCHED_VIDEO_TIME_TABLE.getMs("account1", "watchSession1"),
          eq(120),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, {
            watchSessionWatcherIdEq: "account1",
            watchSessionWatchSessionIdEq: "watchSession1",
          }),
          isArray([
            eqMessage(
              {
                watchSessionWatcherId: "account1",
                watchSessionSeasonId: "season1",
                watchSessionEpisodeId: "episode1",
                watchSessionWatchSessionId: "watchSession1",
                watchSessionCreatedTimeMs: 100,
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchSessionStatement({
              watchSessionWatcherIdEq: "account1",
              watchSessionWatchSessionIdEq: "watchSession1",
            }),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
  ],
});
