"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// providers/fanbroj/meta.ts
var meta_exports = {};
__export(meta_exports, {
  getMeta: () => getMeta
});
module.exports = __toCommonJS(meta_exports);
var getMeta = /* @__PURE__ */ __name(function(_0) {
  return __async(this, arguments, function* ({
    link,
    provider,
    providerContext
  }) {
    var _a, _b;
    const { axios, commonHeaders } = providerContext;
    const baseUrl = "https://fanbroj.net";
    const isSeries = link.includes("/series/");
    const slug = link.split("/").pop() || "";
    let apiUrl = "";
    if (isSeries) {
      apiUrl = `${baseUrl}/api/series/${slug}`;
    } else {
      apiUrl = `${baseUrl}/api/movies?slug=${slug}`;
    }
    try {
      const res = yield axios.get(apiUrl, {
        headers: __spreadProps(__spreadValues({}, commonHeaders), {
          Referer: baseUrl
        })
      });
      const data = res.data;
      if (!data) throw new Error("No data found");
      const info = {
        title: data.title || "",
        image: data.posterUrl || data.backdropUrl || "",
        synopsis: data.overview || data.description || "",
        imdbId: data.imdbId || "",
        // Might be empty, but that's okay
        type: isSeries ? "series" : "movie",
        rating: (_a = data.rating) == null ? void 0 : _a.toString(),
        cast: (_b = data.cast) == null ? void 0 : _b.map((c) => c.name),
        linkList: []
      };
      if (isSeries) {
        info.linkList.push({
          title: "Default",
          episodesLink: link
          // Pass the original link, GetEpisodeLinks will handle it
        });
      } else {
        const directLinks = (data.embeds || []).map((embed) => ({
          title: embed.label || "Server",
          link: embed.url,
          type: "movie"
        }));
        info.linkList.push({
          title: "Default",
          directLinks
        });
      }
      return info;
    } catch (error) {
      console.error(`Fanbroj getMetaData Error: ${error}`);
      return {
        title: "",
        image: "",
        synopsis: "",
        imdbId: "",
        type: "movie",
        linkList: []
      };
    }
  });
}, "getMeta");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getMeta
});
