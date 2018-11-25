/*
 * List files in a directory including various systems information.
 * Saleem Bhatti, Sep 2018
 */

"use strict";

// https://nodejs.org/docs/latest-v8.x/api/fs.html
const fs = require('fs');
// https://nodejs.org/docs/latest-v8.x/api/os.html
const os = require('os');
// https://nodejs.org/docs/latest-v8.x/api/path.html
const path = require('path');

// https://nodejs.org/docs/latest-v8.x/api/errors.html#errors_class_error
// https://nodejs.org/docs/latest-v8.x/api/fs.html#fs_fs_statsync_path
// https://nodejs.org/docs/latest-v8.x/api/fs.html#fs_class_fs_stats
// https://nodejs.org/docs/latest-v8.x/api/fs.html#fs_fs_readdirsync_path_options

const fileInfo_keys = [
  "filename", "type", "size",
  "atime", "mtime", "ctime", "birthtime"
];

const dirInfo_keys = [
  "server", "directoryname", "files"
];


function // This function turns a directory into a JSON object.
  getDirInfo(dirPath, callback) { /* callback(error, result) */

  if (!dirPath || !callback) { return null; }

  let dirInfo = {};
  dirInfo["server"] = os.hostname();
  dirInfo["directoryname"] = dirPath;
  dirInfo["files"] = {};
  let error = null;

  try {
    let files = fs.readdirSync(dirPath);

    if (files) {

      for (let f = 0; f < files.length; ++f) {
        let filename = files[f];
        let filePath = path.join(dirPath, filename);
        let fs_stats = fs.statSync(filePath);

        let type = "unknown";
        if (fs_stats.isFile()) { type = "file"; }
        else if (fs_stats.isDirectory()) { type = "directory"; }
        else if (fs_stats.isBlockDevice()) { type = "block"; }
        else if (fs_stats.isCharacterDevice()) { type = "character"; }
        else if (fs_stats.isFIFO()) { type = "fifo"; }
        else if (fs_stats.isSocket()) { type = "socket"; }

        /* The information we need */
        let fileInfo = {};
        fileInfo["filename"] = filename;
        fileInfo["type"] = type;
        for (let i = 0; i < fileInfo_keys.length; ++i) {
          let k = fileInfo_keys[i];

          if (k === "filename" || k === "type") { continue; }

          let v = fs_stats[k];

          if (k.includes("time")) {
            // Date/Time is not handled so well in JavaScript.
            // Safest option is to use:
            //    "time since 01 Jan 1970 in milliseconds"
            // but convert that from the string version of
            // the various time attributes if the file stats.
            let t = Date.parse(v);
            v = t;
          }

          fileInfo[k] = v;
        }
        dirInfo["files"][files[f]] = fileInfo;
      } // for (f)

    } // if (files)

  } // try

  catch (e) {
    let e_s = null;
    switch (e["code"]) {
      case "ENOENT": e_s = "No such path: " + dirPath; break;
      case "ENOTDIR": e_s = "Not a directory: " + dirPath; break;
      default: e_s = JSON.stringify(error); break;
    } // switch
    console.log(e_s);
    error = e;
  } // catch

  finally {
    callback(error, dirInfo);
  } // finally

} // function getDirFileInfo()


function
  fileInfo2Markup(fileInfo) {

  const fileInfo_keys = [
    "filename", "type", "size",
    "atime", "mtime", "ctime", "birthtime"
  ];

  if (!fileInfo) { return null; }

  let markup = "";
  // leading spaces and "\n" for convenience only - not needed
  //markup += "\n    <fileinfo type=\"" + fileInfo["type"] + "\">\n";


  markup += "\n    <fileinfo type=\"" + fileInfo["type"] + "\"";


  /**
   * This 'if' is to add an onclick event to cells that represent a directory
   */
  if (fileInfo["type"] == "directory") {
    markup += "onclick=\"getDirectory(this.id)\"";
    markup += "id=\"" + fileInfo["filename"] + "\"";
  }

  markup += ">\n";

  for (let i = 0; i < fileInfo_keys.length; ++i) {
    let k = fileInfo_keys[i];
    let v = fileInfo[k];
    let a = ""; // attributes for markup tag
    if (k.includes("time")) {
      // Keep the millisecond time as an attribute, but
      // use a user-friendly string to display in markup.
      // The millisecond time could be useful for ordering files.
      let t = new Date();
      t.setTime(v);
      a += " " + k + "=\"" + v + "\"";
      v = t.toLocaleString("en-GB");
    }
    markup += "      <" + k + a + ">" + v + "</" + k + ">\n";
  }
  markup += "    </fileinfo>\n";

  return markup;
}


function
  dirInfo2Markup(dirInfo) {
  if (!dirInfo) { return null; }

  let markup = "";

  // leading spaces and "\n" for convenience only - not neededs

  markup += "\n  <dirinfo>\n\n";
  markup += "      <server>" + dirInfo["server"] + "</server>\n\n";
  markup += "<hr\\>"
  markup += "      <directoryname>" + dirInfo["directoryname"] + "</directoryname>\n\n";
  markup += " <button type=\"button\" onclick=\"back()\">Previous Directory</button> "

  let files = dirInfo["files"];
  let filenames = Object.keys(files);

  markup += "    <files>\n";
/**
 * This markup creates headers headers for the html
 */
  markup += "<headers>";
  markup += "<filename class =\"header\"  onclick=\"hide('filename')\">File Name</filename>";
  markup += "<type class =\"header\" onclick=\"hide('type')\">Type</type>";
  markup += "<size class =\"header\"onclick=\"hide('size')\">Size</size>";
  markup += "<atime class =\"header\"onclick=\"hide('atime')\">Access Time</atime>";
  markup += "<mtime class =\"header\"onclick=\"hide('mtime')\">Modification Time</mtime>";
  markup += "<ctime class =\"header\"onclick=\"hide('ctime')\">Creation Time</ctime>";
  markup += "<birthtime class =\"header\"onclick=\"hide('birthtime')\">Birth Time</birthtime>";
  markup += "</headers>";
  for (let f = 0; f < filenames.length; ++f) {
    let fileInfo = files[filenames[f]];
    markup += fileInfo2Markup(fileInfo);
  }
  markup += "\n    </files>\n";

  markup += "\n  </dirinfo>\n";

  return markup;
}
/* module.exports is only needed server-side for node.js */
if (typeof module !== "undefined" &&
  typeof module.exports !== "undefined") {
  module.exports = {
    "fileInfo_keys": fileInfo_keys,
    "dirInfo_keys": dirInfo_keys,
    "getDirInfo": getDirInfo,
    "fileInfo2Markup": fileInfo2Markup,
    "dirInfo2Markup": dirInfo2Markup
  };
}
