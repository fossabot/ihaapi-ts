import * as express from "express";
import { VTubersDB } from "../dbconn";
import { parse_youtube_live_args, bilibili_use_uuids } from "../utils/filters";
import { LiveMap, BilibiliData, YTLiveArray, YouTubeData } from "../utils/models";
const othersroutes = express.Router()

othersroutes.use((req, res, next) => {
    res.header({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, HEAD"
    })
    next()
});

/**
 * @swagger
 * /other/upcoming:
 *  get:
 *      summary: Upcoming Others VTubers BiliBili Streams
 *      description: Fetch a list of upcoming streams from BiliBili for Other VTubers, updated every 4 minutes.
 *      tags:
 *      - Others
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: query
 *        name: uids
 *        description: Filter upcoming results with User ID (support multiple id separated by comma)
 *        required: false
 *        type: string
 *      responses:
 *          '200':
 *              description: A list of upcoming streams
 *              schema:
 *                  type: object
 *                  properties:
 *                      upcoming:
 *                          type: array
 *                          items:
 *                              $ref: '#/definitions/BiliScheduleModel'
 *                      cached:
 *                          type: boolean
 */
othersroutes.get("/upcoming", (req, res) => {
    let user_query = req.query;
    res.header({
        "Cache-Control": "public, max-age=60, immutable"
    });
    try {
        console.log("[OthersBili] Fetching Database...");
        VTubersDB.open_collection("otherbili_data")
            .then(data_docs => {
                console.log("[OthersBili] Parsing Database...");
                let vtb_res: LiveMap<BilibiliData[]> = data_docs[0];
                try {
                    delete vtb_res["_id"];
                } catch (error) {
                    console.error(error);
                }
                let final_mappings: LiveMap<BilibiliData[]> = {};
                console.log("[OthersBili] Filtering Database...");
                // @ts-ignore
                final_mappings["upcoming"] = bilibili_use_uuids(user_query.uuid, vtb_res["upcoming"]);
                final_mappings["cached"] = true;
                console.log("[OthersBili] Sending...");
                res.json(final_mappings)
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({message: "Internal server error occured."});
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Internal server error occured."});
    }
});


/**
 * @swagger
 * /other/youtube/live:
 *  get:
 *      summary: Live/Upcoming Others VTubers YouTube Streams
 *      description: |
 *          Fetch a list of live/upcoming streams from YouTube for Other VTubers, updated every 1 minute for live data and 2 minutes for upcoming data.
 *       
 *          The results can be filtered by using Query parameters
 *          The query params can handle multiple values, separate them by using comma (,)
 *          For example: `/other/youtube/live?group=voms,others,honeystrap`
 * 
 *          Wrong parameters value will just be ignored and not gonna return error.
 *      tags:
 *      - Others
 *      produces:
 *      - application/json
 *      parameters:
 *      - in: query
 *        name: status
 *        description: Filter status (live/upcoming/ended) that will be returned, multiples value are separated by comma
 *        required: false
 *        type: string
 *        enum:
 *        - live
 *        - upcoming
 *        - ended
 *      - in: query
 *        name: group
 *        description: Filter groups that will be returned, multiples value are separated by comma
 *        required: false
 *        type: string
 *        enum:
 *        - vtuberesports
 *        - lupinusvg
 *        - irisblackgames
 *        - cattleyareginagames
 *        - nanashi
 *        - animare
 *        - vapart
 *        - honeystrap
 *        - sugarlyric
 *        - mahapanca
 *        - vivid
 *        - noripro
 *        - hanayori
 *        - voms
 *        - others
 *      - in: query
 *        name: fields
 *        description: Filter fields that will be returned, multiples value are separated by comma
 *        required: false
 *        type: string
 *        enum:
 *        - id
 *        - title
 *        - startTime
 *        - endTime
 *        - status
 *        - thumbnail
 *        - viewers
 *        - channel
 *      responses:
 *          '200':
 *              description: A list of live/upcoming/ended streams
 *              schema:
 *                  type: object
 *                  properties:
 *                      live:
 *                          type: array
 *                          items:
 *                              $ref: '#/definitions/YouTubeScheduleModel'
 *                      upcoming:
 *                          type: array
 *                          items:
 *                              $ref: '#/definitions/YouTubeScheduleModel'
 *                      ended:
 *                          type: array
 *                          items:
 *                              $ref: '#/definitions/YouTubeScheduleModel'
 *                      cached:
 *                          type: boolean
 */
othersroutes.get("/youtube/live", (req, res) => {
    let user_query = req.query;
    try {
        console.log("[OthersYT] Fetching Database...");
        VTubersDB.open_collection("yt_other_livedata")
            .then(data_docs => {
                console.log("[OthersYT] Parsing Database...");
                let vtb_res: YTLiveArray<YouTubeData[]> = data_docs[0];
                try {
                    delete vtb_res["_id"];
                } catch (error) {
                    console.error(error);
                }
                console.log("[OthersYT] Filtering Database...")
                let final_mappings = parse_youtube_live_args(user_query, vtb_res);
                final_mappings["cached"] = true;
                console.log("[OthersYT] Sending...");
                res.json(final_mappings)
            })
            .catch(error => {
                console.log(error);
                res.status(500).json({message: "Internal server error occured."});
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Internal server error occured."});
    }
});

export { othersroutes };