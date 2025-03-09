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
import { WATCH_TIME_TABLE } from "../common/watch_time_table";
import { WatchEpisodeHandler } from "./watch_episode_handler";
import { WATCH_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
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
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
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
            episodeIndex: 1,
            watchTimeMs: 60,
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
          await WATCH_TIME_TABLE.getMs("account1", "uuid1"),
          eq(60),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, "account1", "uuid1"),
          isArray([
            eqMessage(
              {
                watchSessionData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  watchSessionId: "uuid1",
                  createdTimeMs: 1000,
                },
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, "account1", "season1"),
          isArray([
            eqMessage(
              {
                watchedSeasonData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  latestEpisodeId: "episode1",
                  latestWatchSessionId: "uuid1",
                  latestEpisodeIndex: 1,
                  updatedTimeMs: 1000,
                },
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(
            SPANNER_DATABASE,
            "account1",
            "season1",
            "episode1",
          ),
          isArray([
            eqMessage(
              {
                watchedEpisodeData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  episodeIndex: 1,
                  latestWatchSessionId: "uuid1",
                  updatedTimeMs: 1000,
                },
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
            deleteWatchSessionStatement("account1", "uuid1"),
            deleteWatchedSeasonStatement("account1", "season1"),
            deleteWatchedEpisodeStatement("account1", "season1", "episode1"),
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
              latestEpisodeIndex: 1,
              latestWatchSessionId: "watchSession1",
              updatedTimeMs: 100,
            }),
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
        let serviceClientMock = new NodeServiceClientMock();
        serviceClientMock.response = {
          accountId: "account1",
          capabilities: {
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
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
            episodeIndex: 1,
            watchTimeMs: 60,
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
          await WATCH_TIME_TABLE.getMs("account1", "uuid1"),
          eq(60),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, "account1", "uuid1"),
          isArray([
            eqMessage(
              {
                watchSessionData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  watchSessionId: "uuid1",
                  createdTimeMs: 1000,
                },
              },
              GET_WATCH_SESSION_ROW,
            ),
          ]),
          "WatchSession",
        );
        assertThat(
          await getWatchedSeason(SPANNER_DATABASE, "account1", "season1"),
          isArray([
            eqMessage(
              {
                watchedSeasonData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  latestEpisodeId: "episode1",
                  latestWatchSessionId: "uuid1",
                  latestEpisodeIndex: 1,
                  updatedTimeMs: 1000,
                },
              },
              GET_WATCHED_SEASON_ROW,
            ),
          ]),
          "WatchedSeason",
        );
        assertThat(
          await getWatchedEpisode(
            SPANNER_DATABASE,
            "account1",
            "season1",
            "episode1",
          ),
          isArray([
            eqMessage(
              {
                watchedEpisodeData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  episodeIndex: 1,
                  latestWatchSessionId: "uuid1",
                  updatedTimeMs: 1000,
                },
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
            deleteWatchSessionStatement("account1", "uuid1"),
            deleteWatchedSeasonStatement("account1", "season1"),
            deleteWatchedEpisodeStatement("account1", "season1", "episode1"),
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
            canConsumeShows: true,
          },
        } as ExchangeSessionAndCheckCapabilityResponse;
        let handler = new WatchEpisodeHandler(
          SPANNER_DATABASE,
          WATCH_TIME_TABLE,
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
            watchTimeMs: 120,
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
          await WATCH_TIME_TABLE.getMs("account1", "watchSession1"),
          eq(120),
          "WatchTime",
        );
        assertThat(
          await getWatchSession(SPANNER_DATABASE, "account1", "watchSession1"),
          isArray([
            eqMessage(
              {
                watchSessionData: {
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  watchSessionId: "watchSession1",
                  createdTimeMs: 100,
                },
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
            deleteWatchSessionStatement("account1", "watchSession1"),
          ]);
          await transaction.commit();
        });
        await BIGTABLE.deleteRows("w");
      },
    },
  ],
});
