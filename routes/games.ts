import * as express from "express";
import { hltb_search } from "../utils/hltb";
import { do_search_on_steam, do_steamdb_search, fetch_steam_game_info, fetch_steam_user_info } from "../utils/steam";
import { is_none, map_bool } from "../utils/swissknife";

const gamesroutes = express.Router();

gamesroutes.use((req, res, next) => {
    res.header({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, HEAD"
    });
    next();
});

/**
 * @swagger
 * /games/hltb:
 *  get:
 *      summary: Get Information from HowLongToBeat.com
 *      description: Get how long the game need to be beaten provided by HowLongToBeat.com
 *      tags:
 *      - games_api
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: query
 *        name: q
 *        description: Game that want to be searched (shorthand for `query`)
 *        required: true
 *        type: string
 *      - in: query
 *        name: p
 *        description: Page number to be checked.
 *        type: number
 *      x-codeSamples:
 *      - lang: Python
 *        label: Python3
 *        source: |
 *           import requests
 *           res = requests.get("https://api.ihateani.me/games/hltb?q=Hades").json()
 *           print(res["results"])
 *      responses:
 *          '200':
 *              description: A list of queried HLTB Info
 *              schema:
 *                  type: object
 *                  properties:
 *                      results:
 *                          type: array
 *                          description: A list of queried HLTB Info
 *                          items:
 *                              type: object
 *                              description: HLTB data
 *                              properties:
 *                                  title:
 *                                      type: string
 *                                      description: The game title.
 *                                  image:
 *                                      type: string
 *                                      description: The game artwork image (URL).
 *                                  color:
 *                                      type: number
 *                                      description: Discord friendly color mark.
 *                                  url:
 *                                      type: string
 *                                      description: The HLTB game link.
 *                                  stats:
 *                                      type: object
 *                                      description: contains a key and value of game statistics provided by user.
 *                                  hltb:
 *                                      type: object
 *                                      description: The time needed to beat the game
 *                                      properties:
 *                                          main:
 *                                              type: string
 *                                              description: Time needed for Main Story
 *                                          main_extra:
 *                                              type: string
 *                                              description: Time needed for Main Story + Extra stuff
 *                                          complete:
 *                                              type: string
 *                                              description: Time needed for Completionist route
 *                                          solo:
 *                                              type: string
 *                                              description: Time needed for Solo completion
 *                                          coop:
 *                                              type: string
 *                                              description: Time needed for Co-Op completion
 *                                          versus:
 *                                              type: string
 *                                              description: Time needed for Versus Mode
 *                                          single_player:
 *                                              type: string
 *                                              description: Time needed for Single-Player Mode
 *          '400':
 *              description: Missing query params
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Error message
 *                          example: please provide `q` args on the url
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 *                          example: 400
 *                      example:
 *                          type: string
 *                          description: Example about how you should do it (Might not be avaible.)
 *                          example: /games/hltb?q=ori and the
 *          'default':
 *              description: An error occured
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Why it failed to process.
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 */
gamesroutes.get("/hltb", (req, res) => {
    let search_query = req.query.q;
    let req_page = req.query.p;
    if (is_none(req_page)) {
        req_page = "1";
    }
    // @ts-ignore
    let page_num = parseInt(req_page);
    if (isNaN(page_num)) {
        page_num = 1;
    }
    if (is_none(search_query)) {
        search_query = req.query.query;
        if (is_none(search_query)) {
            res.status(400).json(
                {
                    "error": "please provide `q` args on the url",
                    "example": "/games/hltb?q=ori and the",
                    "code": 400
                }
            );
        };
        console.info(`[Games:hltb] Searching ${search_query}`);
        // @ts-ignore
        search_query = decodeURIComponent(search_query);
        try {
            hltb_search(search_query, page_num).then(([hltb_results, hltb_message]) => {
                if (hltb_results.length == 0) {
                    var err_code = 500
                    if (hltb_message.toLowerCase().includes("no results")) {
                        err_code = 404
                    }
                    res.status(err_code).json(
                        {
                            "error": hltb_message,
                            "code": err_code
                        }
                    )
                }
                res.json({"results": hltb_results});
            }).catch((error) => {
                console.error(error);
                res.status(500).json({message: "Internal server error occured."});
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({message: "Internal server error occured."});
        }
    } else {
        console.info(`[Games:hltb] Searching ${search_query}`);
        // @ts-ignore
        search_query = decodeURIComponent(search_query);
        try {
            hltb_search(search_query, page_num).then(([hltb_results, hltb_message]) => {
                if (hltb_results.length == 0) {
                    var err_code = 500
                    if (hltb_message.toLowerCase().includes("no results")) {
                        err_code = 404
                    }
                    res.status(err_code).json(
                        {
                            "error": hltb_message,
                            "code": err_code
                        }
                    )
                }
                res.json({"results": hltb_results});
            }).catch((error) => {
                console.error(error);
                res.status(500).json({message: "Internal server error occured."});
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({message: "Internal server error occured."});
        }
    }
})

function steam_fetch_user(req, res) {
    let user_id = req.params.user_id;
    console.log("[Games:steamuser] Querying " + user_id);
    fetch_steam_user_info(user_id).then(function (value) {
        let user_data = value[0];
        let message = value[1];
        if (message.toLowerCase() !== "success") {
            var err_code = 500;
            if (message.includes("resolve vanity")) {
                err_code = 404;
            }
            res.status(err_code).json({"error": message, "code": err_code});
        } else {
            res.json(user_data);
        }
    });
};


/**
 * @swagger
 * /games/steam/user/{user_id}:
 *  get:
 *      summary: Get Steam User Information
 *      description: Fetch information about an User according to Steam Developer API
 *      tags:
 *      - games_api
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: path
 *        name: user_id
 *        description: SteamID64 or Steam Vanity Username
 *        required: true
 *        schema:
 *          type: string
 *      x-codeSamples:
 *      - lang: Python
 *        label: Python3
 *        source: |
 *           import requests
 *           res = requests.get("https://api.ihateani.me/games/steam/user/N4O").json()
 *           print(res)
 *      responses:
 *          '200':
 *              description: A Steam User Info
 *              schema:
 *                  type: object
 *                  description: A Steam User Info
 *                  required: ["id", "name", "url", "avatar", "created", "last_seen", "state", "state_detail", "visibility", "visibility_detail", "level", "total_friends", "total_games", "ban_data"]
 *                  properties:
 *                      id:
 *                          type: string
 *                          description: Steam User ID
 *                      name:
 *                          type: string
 *                          description: Steam Profile Name
 *                      url:
 *                          type: string
 *                          description: Steam Profile URL
 *                      avatar:
 *                          type: string
 *                          description: Steam Profile Avatar (URL)
 *                      created:
 *                          type: number
 *                          description: Steam Profile Account Creation Time (UTC since Epoch)
 *                      last_seen:
 *                          type: number
 *                          description: Steam Profile Last Seen Activity Time (UTC since Epoch)
 *                      vanity_id:
 *                          type: string
 *                          description: Steam Profile Vanity ID (If available)
 *                      state:
 *                          type: number
 *                          description: Steam Profile Account State
 *                          enum: [0, 1, 2, 3, 4, 5, 6]
 *                      state_detail:
 *                          type: string
 *                          description: Steam Profile Account State (Description)
 *                          enum: ["Offline", "Online", "Busy", "Away", "Snooze", "Looking to trade", "Looking to play"]
 *                      visibility:
 *                          type: number
 *                          description: Steam Profile Account Visibilty
 *                          enum: [1, 2, 3, 4, 5]
 *                      visibility_detail:
 *                          type: string
 *                          description: Steam Profile Account State (Description)
 *                          enum: ["Private", "Friends Only", "Friends of Friends", "Users Only", "Public"]
 *                      level:
 *                          type: number
 *                          description: Steam Profile Account Levels
 *                      total_friends:
 *                          type: number
 *                          description: Steam Profile Friends List Total
 *                      total_games:
 *                          type: number
 *                          description: Steam Profile Owned Games Total
 *                      current_game_data:
 *                          type: object
 *                          description: Steam Profile Currently Playing Games Info (Might not be available)
 *                          required: ["id", "title"]
 *                          properties:
 *                              id:
 *                                  type: string
 *                                  description: The Steam Game ID
 *                              title:
 *                                  type: string
 *                                  description: The Steam Game Name
 *                      ban_data:
 *                          type: object
 *                          description: Steam Profile Ban Stats
 *                          required: ["community", "economy", "gameban_total", "vac"]
 *                          properties:
 *                              community:
 *                                  type: boolean
 *                                  description: Is Steam Community Banned or Not?
 *                              economy:
 *                                  type: string
 *                                  description: Is Steam Trading/Economy Banned or Not?
 *                              gameban_total:
 *                                  type: number
 *                                  description: Total In-Game Ban
 *                              vac:
 *                                  type: object
 *                                  description: VAC Ban Info
 *                                  required: ["total", "days_since_last_ban", "vac"]
 *                                  properties:
 *                                      vac:
 *                                          type: boolean
 *                                          description: Currently/Have been VAC Banned or Not?
 *                                      total:
 *                                          type: number
 *                                          description: Total VAC Banned
 *                                      days_since_last_ban:
 *                                          type: number
 *                                          description: Total days since last VAC Ban
 *          'default':
 *              description: An error occured
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Why it failed to process.
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 */
gamesroutes.get("/steam/user/:user_id", steam_fetch_user);


/**
 * @swagger
 * /games/steam/game/{app_id}:
 *  get:
 *      summary: Get Steam Game Information
 *      description: Fetch information about a Game according to Steam API
 *      tags:
 *      - games_api
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: path
 *        name: app_id
 *        description: The App ID
 *        required: true
 *        schema:
 *          type: string
 *      x-codeSamples:
 *      - lang: Python
 *        label: Python3
 *        source: |
 *           import requests
 *           res = requests.get("https://api.ihateani.me/games/steam/game/730").json()
 *           print(res)
 *      responses:
 *          '200':
 *              description: A Steam Game/App/DLC/Music Info
 *              schema:
 *                  type: object
 *                  description: A Steam Game/App/DLC/Music Info
 *                  required: ["id", "title", "developer", "publisher", "thumbnail", "genres", "description", "type", "released", "platforms"]
 *                  properties:
 *                      id:
 *                          type: number
 *                          description: Steam Game ID
 *                      title:
 *                          type: string
 *                          description: Steam Game Name
 *                      developer:
 *                          type: array
 *                          items:
 *                              type: string
 *                          description: Steam Game Developer
 *                      publisher:
 *                          type: array
 *                          items:
 *                              type: string
 *                          description: Steam Game Publisher
 *                      thumbnail:
 *                          type: string
 *                          description: Steam Game Image
 *                      category:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  id:
 *                                      type: number
 *                                      description: Category ID
 *                                  description:
 *                                      type: string
 *                                      description: Category Description
 *                          description: Game Category
 *                      genres:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  id:
 *                                      type: number
 *                                      description: Genre ID
 *                                  description:
 *                                      type: string
 *                                      description: Genre Description
 *                          description: Game Genres
 *                      description:
 *                          type: string
 *                          description: Steam Game Description
 *                      type:
 *                          type: string
 *                          description: The appID type
 *                          enum: ["game", "dlc", "music"]
 *                      released:
 *                          type: string
 *                          description: Game release date
 *                      total_achivements:
 *                          type: number
 *                          description: Total achivements in-game
 *                      screenshots:
 *                          type: array
 *                          items:
 *                              type: string
 *                          description: Game screenshots
 *                      price_data:
 *                          type: object
 *                          description: Game Price data
 *                          required: ["discount", "price"]
 *                          properties:
 *                              discount:
 *                                  type: boolean
 *                                  description: Is the game discounted or not?
 *                              price:
 *                                  type: string
 *                                  description: The game price (in IDR)
 *                              original_price:
 *                                  type: string
 *                                  description: Original game price before discount (in IDR)
 *                              discounted:
 *                                  type: string
 *                                  description: Discount amount
 *                                  example: -50%
 *                      platforms:
 *                          type: object
 *                          description: Available platforms
 *                          required: ["windows", "mac", "linux"]
 *                          properties:
 *                              windows:
 *                                  type: boolean
 *                                  description: Is windows supported?
 *                              mac:
 *                                  type: boolean
 *                                  description: Is macOS supported?
 *                              linux:
 *                                  type: boolean
 *                                  description: Is linux supported?
 *          'default':
 *              description: An error occured
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Why it failed to process.
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 */
gamesroutes.get("/steam/game/:app_id", (req, res) => {
    let app_id = req.params.app_id;
    console.log("[Games:steamgame] Querying " + app_id);
    fetch_steam_game_info(app_id).then(function ([steam_game_info, message]) {
        if (message.toLowerCase() !== "success") {
            var err_code = 500;
            if (message.includes("Failed fetching that appID")) {
                err_code = 404;
            }
            res.status(err_code).json({"error": message, "code": err_code});
        } else {
            res.json(steam_game_info);
        }
    });
});

/**
 * @swagger
 * /games/steam/search:
 *  get:
 *      summary: Search Game on Steam
 *      description: Search game on steam via Steam Web API
 *      tags:
 *      - games_api
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: query
 *        name: q
 *        description: Game that want to be searched (shorthand for `query`)
 *        required: true
 *        type: string
 *      x-codeSamples:
 *      - lang: Python
 *        label: Python3
 *        source: |
 *           import requests
 *           res = requests.get("https://api.ihateani.me/games/steam/search?q=Hades").json()
 *           print(res["results"])
 *      responses:
 *          '200':
 *              description: A list of queried Steam Search
 *              schema:
 *                  type: object
 *                  properties:
 *                      results:
 *                          description: A list of queried Steam Search
 *                          type: array
 *                          items:
 *                              type: object
 *                              required: ["id", "title", "is_free", "thumbnail", "platforms"]
 *                              description: Steam Game Info
 *                              properties:
 *                                  id:
 *                                      type: number
 *                                      description: The game App ID.
 *                                  title:
 *                                      type: string
 *                                      description: The game title.
 *                                  price:
 *                                      type: string
 *                                      description: The game price (in IDR.)
 *                                  is_free:
 *                                      type: boolean
 *                                      description: Is the game free or not.
 *                                  thumbnail:
 *                                      type: string
 *                                      description: The game artwork
 *                                  platforms:
 *                                      type: object
 *                                      description: Available platforms
 *                                      required: ["windows", "mac", "linux"]
 *                                      properties:
 *                                          windows:
 *                                              type: boolean
 *                                              description: Is windows supported?
 *                                          mac:
 *                                              type: boolean
 *                                              description: Is macOS supported?
 *                                          linux:
 *                                              type: boolean
 *                                              description: Is linux supported?
 *          '400':
 *              description: Missing query params
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Error message
 *                          example: please provide `q` args on the url
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 *                          example: 400
 *                      example:
 *                          type: string
 *                          description: Example about how you should do it (Might not be avaible.)
 *                          example: /games/steam/search?q=Hades
 *          'default':
 *              description: An error occured
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Why it failed to process.
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 */
gamesroutes.get("/steam/search", (req, res) => {
    let search_query = req.query.q;
    if (is_none(search_query)) {
        search_query = req.query.query;
        if (is_none(search_query)) {
            res.status(400).json(
                {
                    "error": "please provide `q` args on the url",
                    "example": "/games/steam/search?q=Hades",
                    "code": 400
                }
            );
        };
        console.info(`[Games:steamsearch] Searching ${search_query}`);
        // @ts-ignore
        search_query = decodeURIComponent(search_query);
        try {
            do_search_on_steam(search_query).then((steam_results) => {
                res.json({"results": steam_results});
            }).catch((error) => {
                console.error(error);
                res.status(500).json({error: "Internal server error occured.", code: 500});
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({error: "Internal server error occured.", code: 500});
        }
    } else {
        console.info(`[Games:steamsearch] Searching ${search_query}`);
        // @ts-ignore
        search_query = decodeURIComponent(search_query);
        try {
            do_search_on_steam(search_query).then((steam_results) => {
                res.json({"results": steam_results});
            }).catch((error) => {
                console.error(error);
                res.status(500).json({error: "Internal server error occured.", code: 500});
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({error: "Internal server error occured.", code: 500});
        }
    }
});

/**
 * @swagger
 * /games/steamdb/search:
 *  get:
 *      summary: Search Game on Steam via SteamDB
 *      description: Search game on steam via SteamDB
 *      tags:
 *      - games_api
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: query
 *        name: q
 *        description: Game that want to be searched (shorthand for `query`)
 *        required: true
 *        type: string
 *      - in: query
 *        name: dlc
 *        description: Add DLC to search results (default `false`)
 *        required: false
 *        type: string
 *        enum: ["true", "false"]
 *      - in: query
 *        name: app
 *        description: Add Application to search results (default `false`)
 *        required: false
 *        type: string
 *        enum: ["true", "false"]
 *      - in: query
 *        name: music
 *        description: Add Music to search results (default `false`)
 *        required: false
 *        type: string
 *        enum: ["true", "false"]
 *      x-codeSamples:
 *      - lang: Python
 *        label: Python3
 *        source: |
 *           import requests
 *           res = requests.get("https://api.ihateani.me/games/steamdb/search?q=Hades").json()
 *           print(res["results"])
 *      responses:
 *          '200':
 *              description: A list of queried SteamDB Search
 *              schema:
 *                  type: object
 *                  properties:
 *                      results:
 *                          type: array
 *                          description: A list of queried SteamDB Search
 *                          items:
 *                              type: object
 *                              required: ["id", "title", "platforms", "developer", "publisher", "released", "tags", "categories", "type"]
 *                              description: Steam Game Info
 *                              properties:
 *                                  id:
 *                                      type: number
 *                                      description: The game App ID.
 *                                  title:
 *                                      type: string
 *                                      description: The game title.
 *                                  price:
 *                                      type: string
 *                                      description: The game price (in USD.)
 *                                  developer:
 *                                      type: string
 *                                      description: The game developer.
 *                                  publisher:
 *                                      type: string
 *                                      description: The game publisher.
 *                                  released:
 *                                      type: string
 *                                      description: The game release date.
 *                                  user_score:
 *                                      type: number
 *                                      description: The game user score.
 *                                  platforms:
 *                                      type: object
 *                                      description: Available platforms
 *                                      required: ["windows", "mac", "linux"]
 *                                      properties:
 *                                          windows:
 *                                              type: boolean
 *                                              description: Is windows supported?
 *                                          mac:
 *                                              type: boolean
 *                                              description: Is macOS supported?
 *                                          linux:
 *                                              type: boolean
 *                                              description: Is linux supported?
 *                                  tags:
 *                                      type: array
 *                                      description: The game tags.
 *                                      items:
 *                                          - type: string
 *                                  categories:
 *                                      type: array
 *                                      description: The game categories.
 *                                      items:
 *                                          - type: string
 *                                  type:
 *                                      type: string
 *                                      description: The result type.
 *                                      enum: ["game", "app", "dlc", "music"]
 *          '400':
 *              description: Missing query params
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Error message
 *                          example: please provide `q` args on the url
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 *                          example: 400
 *                      example:
 *                          type: string
 *                          description: Example about how you should do it (Might not be avaible.)
 *                          example: /games/steam/search?q=Hades
 *          'default':
 *              description: An error occured
 *              schema:
 *                  type: object
 *                  properties:
 *                      error:
 *                          type: string
 *                          description: Why it failed to process.
 *                      code:
 *                          type: number
 *                          description: HTTP Status code
 */
gamesroutes.get("/steamdb/search", (req, res) => {
    let search_query = req.query.q;
    let add_dlc = map_bool(req.query.dlc);
    let add_app = map_bool(req.query.app);
    let add_music = map_bool(req.query.music);
    if (is_none(search_query)) {
        search_query = req.query.query;
        if (is_none(search_query)) {
            res.status(400).json(
                {
                    "error": "please provide `q` args on the url",
                    "example": "/games/steamdb/search?q=Hades",
                    "code": 400
                }
            );
        };
        console.info(`[Games:steamdbsearch] Searching ${search_query}`);
        // @ts-ignore
        search_query = decodeURIComponent(search_query);
        try {
            do_steamdb_search(search_query, add_dlc, add_app, add_music).then(([steam_results, message]) => {
                if (message.toLowerCase() !== "success.") {
                    var err_code = 500;
                    if (message.includes("no results.")) {
                        err_code = 404;
                    }
                    res.status(err_code).json({"error": message, "code": err_code});
                } else {
                    res.json({"results": steam_results});
                }
            }).catch((error) => {
                console.error(error);
                res.status(500).json({error: "Internal server error occured.", code: 500});
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({error: "Internal server error occured.", code: 500});
        }
    } else {
        console.info(`[Games:steamdbsearch] Searching ${search_query}`);
        // @ts-ignore
        search_query = decodeURIComponent(search_query);
        try {
            do_steamdb_search(search_query, add_dlc, add_app, add_music).then(([steam_results, message]) => {
                if (message.toLowerCase() !== "success.") {
                    var err_code = 500;
                    if (message.includes("no results.")) {
                        err_code = 404;
                    }
                    res.status(err_code).json({"error": message, "code": err_code});
                } else {
                    res.json({"results": steam_results});
                }
            }).catch((error) => {
                console.error(error);
                res.status(500).json({error: "Internal server error occured.", code: 500});
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({error: "Internal server error occured.", code: 500});
        }
    }
});


// Handle old routes
gamesroutes.all("/steamuser/:user_id", (req, res, next) => {
    next();
}, steam_fetch_user);

export { gamesroutes };