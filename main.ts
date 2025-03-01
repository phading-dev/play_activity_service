import http = require("http");
import { ENV_VARS } from "./env";
import { AddToWatchLaterListHandler } from "./show/web/add_to_watch_later_list_handler";
import { DeleteFromWatchLaterListHandler } from "./show/web/delete_from_watch_later_list_handler";
import { GetContinueEpisodeHandler } from "./show/web/get_continue_episode";
import { GetContinueTimeForEpisodeHandler } from "./show/web/get_continue_time_for_episode_handler";
import { ListFromWatchLaterListHandler } from "./show/web/list_from_watch_later_list_handler";
import { ListWatchedEpisodesHandler } from "./show/web/list_watched_episodes_handler";
import { WatchEpisodeHandler } from "./show/web/watch_episode_handler";
import { PLAY_ACTIVITY_WEB_SERVICE } from "@phading/play_activity_service_interface/service";
import { ServiceHandler } from "@selfage/service_handler/service_handler";

async function main() {
  let service = ServiceHandler.create(http.createServer())
    .addCorsAllowedPreflightHandler()
    .addHealthCheckHandler()
    .addMetricsHandler();
  service
    .addHandlerRegister(PLAY_ACTIVITY_WEB_SERVICE)
    .add(AddToWatchLaterListHandler.create())
    .add(DeleteFromWatchLaterListHandler.create())
    .add(GetContinueEpisodeHandler.create())
    .add(GetContinueTimeForEpisodeHandler.create())
    .add(ListFromWatchLaterListHandler.create())
    .add(ListWatchedEpisodesHandler.create())
    .add(WatchEpisodeHandler.create());
  await service.start(ENV_VARS.port);
}

main();
