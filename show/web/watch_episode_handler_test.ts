import "../../local/env";
import { SPANNER_DATABASE } from "../../common/spanner_database";
import {
  GET_WATCH_EPISODE_SESSION_ROW,
  deleteWatchEpisodeSessionStatement,
  getWatchEpisodeSession,
  insertWatchEpisodeSessionStatement,
} from "../../db/sql";
import { WatchEpisodeHandler } from "./watch_episode_handler";
import { WATCH_EPISODE_RESPONSE } from "@phading/play_activity_service_interface/show/web/interface";
import { ExchangeSessionAndCheckCapabilityResponse } from "@phading/user_session_service_interface/node/interface";
import { newNotFoundError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { eqMessage } from "@selfage/message/test_matcher";
import { NodeServiceClientMock } from "@selfage/node_service_client/client_mock";
import { assertReject, assertThat, isArray } from "@selfage/test_matcher";
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
          await getWatchEpisodeSession(SPANNER_DATABASE, "uuid1"),
          isArray([
            eqMessage(
              {
                watchEpisodeSessionData: {
                  watchSessionId: "uuid1",
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  watchTimeMs: 60,
                  lastUpdatedTimeMs: 1000,
                },
              },
              GET_WATCH_EPISODE_SESSION_ROW,
            ),
          ]),
          "WatchEpisodeSession",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchEpisodeSessionStatement("uuid1"),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "UpdateWatchTimeOnExistingSession",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession1",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 60,
              lastUpdatedTimeMs: 100,
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
          await getWatchEpisodeSession(SPANNER_DATABASE, "watchSession1"),
          isArray([
            eqMessage(
              {
                watchEpisodeSessionData: {
                  watchSessionId: "watchSession1",
                  watcherId: "account1",
                  seasonId: "season1",
                  episodeId: "episode1",
                  watchTimeMs: 120,
                  lastUpdatedTimeMs: 1000,
                },
              },
              GET_WATCH_EPISODE_SESSION_ROW,
            ),
          ]),
          "WatchEpisodeSession",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchEpisodeSessionStatement("watchSession1"),
          ]);
          await transaction.commit();
        });
      },
    },
    {
      name: "EpsiodeIdDoesNotMatch",
      async execute() {
        // Prepare
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            insertWatchEpisodeSessionStatement({
              watchSessionId: "watchSession1",
              watcherId: "account1",
              seasonId: "season1",
              episodeId: "episode1",
              watchTimeMs: 60,
              lastUpdatedTimeMs: 100,
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
          serviceClientMock,
          () => "uuid1",
          () => 1000,
        );

        // Execute
        let error = await assertReject(
          handler.handle(
            "",
            {
              watchSessionId: "watchSession1",
              seasonId: "season1",
              episodeId: "episode2",
              watchTimeMs: 120,
            },
            "session1",
          ),
        );

        // Verify
        assertThat(
          error,
          eqHttpError(
            newNotFoundError(
              "does not match season season1 or episode episode2",
            ),
          ),
          "error",
        );
      },
      async tearDown() {
        await SPANNER_DATABASE.runTransactionAsync(async (transaction) => {
          await transaction.batchUpdate([
            deleteWatchEpisodeSessionStatement("watchSession1"),
          ]);
          await transaction.commit();
        });
      },
    },
  ],
});
